$(document).ready(function() {
    let exp_song_id = null;
    let top5_songs = [];

    const element = document.getElementById('player');
    // Songleプレイヤーのサイズ調整
    const height = element.offsetHeight;
    const player_weight = element.offsetWidth;
    const video_player_height = height - 100;

    let myChartLyric, myChartVocal, myChartInst;
    let lyric_scatterData, vocal_scatterData, inst_scatterData;
    let listenSongID = first_songId; // 再生中の楽曲
    let before_listenSongID;
    let called = false;
    
    // 評価ボタンの初期値
    let desiredMaxLyric = null;
    let desiredMaxVocal = null;
    let desiredMaxInst = null;

    // シグマの初期値
    let vocal_sigma = 50;
    let inst_sigma = 50;
    let lyric_sigma = 50;

    // const toleranceSetting = "Each" // "Each" "All"
    // const concatType = "AllPattern" // "AllPattern" "MaxMin"
    console.log("toleranceSetting: " + toleranceSetting);
    console.log("concatType: " + concatType);

    let evaluatedSongMap = {};  // 評価された曲をsongidごとに1つだけ保持
    let evaluationOrder = 1;    // 評価順インクリメント用
    
    // songData：配列型の楽曲データ（例：songData["sm15630734"] = 千本桜に関する全データ）
    vocal_scatterData = createScatterData(songData, "vocal");
    inst_scatterData = createScatterData(songData, "inst");
    lyric_scatterData = createScatterData(songData, "lyric");
    // console.log(vocal_scatterData);

    myChartVocal = renderScatterPlot("vocal-scatter", Object.values(vocal_scatterData), "vocal");
    myChartInst = renderScatterPlot("inst-scatter", Object.values(inst_scatterData), "inst");
    myChartLyric = renderScatterPlot("lyric-scatter", Object.values(lyric_scatterData), "lyric");

    songle_player(listenSongID); // songleプレイヤーの表示

    // スライダーで調整した際の更新
    $('#slider1').on('input', function() {
        vocal_sigma = $(this).val();
        // console.log("vocal:"+ vocal_sigma/1000);
        if (toleranceSetting === "Each") {
            EachGiveZ_value('vocal'); // Zの計算と付与（各データのvalueも付与）
            selectedScatterPlotColors(listenSongID, 'vocal'); // 点に着色
        } else if (toleranceSetting === "All") {
            AllGiveZ_value('vocal');
        }
    });
    $('#slider2').on('input', function() {
        inst_sigma = $(this).val();
        // console.log("accompaniment:"+ inst_sigma/1000);
        if (toleranceSetting === "Each") {
            EachGiveZ_value('inst'); // Zの計算と付与（各データのvalueも付与）
            selectedScatterPlotColors(listenSongID, 'inst'); // 点に着色
        } else if (toleranceSetting === "All") {
            AllGiveZ_value('inst');
        }
    });
    $('#slider3').on('input', function() {
        lyric_sigma = $(this).val();
        // console.log("lyrics:"+ lyric_sigma/1000);
        if (toleranceSetting === "Each") {
            EachGiveZ_value('lyric'); // Zの計算と付与（各データのvalueも付与）
            selectedScatterPlotColors(listenSongID, 'lyric'); // 点に着色
        } else if (toleranceSetting === "All") {
            AllGiveZ_value('lyric');
        }
    });

    // 各評価ボタンのアイコンの色を変更する関数
    $('.rating-button').on('click', function () {
        // 同じ評価タイプ内のすべてのボタンをリセット
        $(this).closest('.evaluation-content').find('.rating-button').removeClass('active');
        
        // クリックされたボタンに"active"クラスを追加
        $(this).addClass('active');

        // desired_maxを更新
        const parentDivId = $(this).closest('.evaluation-content').parent().attr('id');
        const value = parseFloat($(this).data('value'));
        // console.log(parentDivId);

        if (parentDivId === 'vocal-evaluation') {
            // 歌声を評価したとき
            desiredMaxVocal = value;
            vocal_scatterData[listenSongID].Z_value = desiredMaxVocal;
            vocal_scatterData[listenSongID].vocal_value = desiredMaxVocal;
            vocal_scatterData[listenSongID].vocal_rating = desiredMaxVocal;
            vocal_scatterData[listenSongID].listen_flag = true;
            songData[listenSongID].listen_flag = true;
            songData[listenSongID].vocal_rating = desiredMaxVocal;

            if (toleranceSetting === "Each") {
                EachGiveZ_value('vocal'); // Zの計算と付与（各データのvalueも付与）
                selectedScatterPlotColors(listenSongID, 'vocal'); // 点に着色
            } else if (toleranceSetting === "All") {
                AllGiveZ_value('vocal');
            }
        } else if (parentDivId === 'inst-evaluation') {
            // 伴奏を評価したとき
            desiredMaxInst = value;
            inst_scatterData[listenSongID].Z_value = desiredMaxInst;
            inst_scatterData[listenSongID].inst_value = desiredMaxInst;
            inst_scatterData[listenSongID].inst_rating = desiredMaxInst;
            inst_scatterData[listenSongID].listen_flag = true;
            songData[listenSongID].listen_flag = true;
            songData[listenSongID].inst_rating = desiredMaxInst;

            if (toleranceSetting === "Each") {
                EachGiveZ_value('inst'); // Zの計算と付与（各データのvalueも付与）
                selectedScatterPlotColors(listenSongID, 'inst'); // 点に着色
            } else if (toleranceSetting === "All") {
                AllGiveZ_value('inst');
            }
        } else if (parentDivId === 'lyric-evaluation') {
            // 歌詞を評価したとき
            desiredMaxLyric = value;
            lyric_scatterData[listenSongID].Z_value = desiredMaxLyric;
            lyric_scatterData[listenSongID].lyric_value = desiredMaxLyric;
            lyric_scatterData[listenSongID].lyric_rating = desiredMaxLyric;
            lyric_scatterData[listenSongID].listen_flag = true;
            songData[listenSongID].listen_flag = true;
            songData[listenSongID].lyric_rating = desiredMaxLyric;

            if (toleranceSetting === "Each") {
                EachGiveZ_value('lyric'); // Zの計算と付与（各データのvalueも付与）
                selectedScatterPlotColors(listenSongID, 'lyric'); // 点に着色
            } else if (toleranceSetting === "All") {
                AllGiveZ_value('lyric');
            }
        }

    });

    // 探索タブ切り替え処理
    $('#explore-playlist').on('click', function () {
        if ($(this).hasClass('select-type')) return;  // タブの連打防止
        finalizeCurrentSongRatings(listenSongID);

        $('#exp-song-content').show();
        $('#rec-song-content').hide();

        $('#explore-playlist').removeClass('non-select-type');
        $('#explore-playlist').addClass('select-type');
        $('#recommend-playlist').removeClass('select-type');
        $('#recommend-playlist').addClass('non-select-type');

        if (exp_song_id) {
            display_song(exp_song_id);
        }
    });

    // 推薦タブ切り替え処理
    $('#recommend-playlist').on('click', function () {
        if ($(this).hasClass('select-type')) return;  // タブの連打防止
        // console.log("before:"+ listenSongID);

        $('#exp-song-content').hide();
        $('#rec-song-content').show();

        $('#recommend-playlist').removeClass('non-select-type');
        $('#recommend-playlist').addClass('select-type');
        $('#explore-playlist').removeClass('select-type');
        $('#explore-playlist').addClass('non-select-type');

        if (typeof top5_songs !== 'undefined') {
            render_rec_songs(top5_songs);
        }
        // console.log("now:"+ listenSongID);
    });

    // 推薦タブ内の楽曲クリックで表示更新
    $(document).on('click', '.rec-song-item', function () {
        finalizeCurrentSongRatings(listenSongID);

        listenSongID = $(this).data('songid');
        if (listenSongID) {
            display_song(listenSongID);
        }
    });

    // exp-song-content 内に動的に挿入された NEXT SONG ボタンをクリックしたときの処理
    $(document).on('click', '#exp-song-content .next-song-button', function () {
        if (songData[listenSongID]?.listen_flag === true) {
            finalizeCurrentSongRatings(listenSongID);

            exp_song_id = explore_song();
            top5_songs = recommend_songs();
            render_exp_song(exp_song_id);
            display_song(exp_song_id);
        } else {
            alert("EXPLORE 楽曲を評価してください");
        }
    });

    // 事前選択の楽曲表示タブから、探索・推薦タブへ表示切り替え
    $('.next-song-button').on('click', function () {
        // 楽曲を評価したか
        if (songData[listenSongID]?.listen_flag === true) {
            finalizeCurrentSongRatings(listenSongID);

            $('.first-song-area').hide();
            exp_song_id = explore_song(); // 探索楽曲
            top5_songs = recommend_songs(); // 推薦楽曲（5曲）

            render_exp_song(exp_song_id); // 探索楽曲を表示
            $('.exp-rec-area').css('display', 'block'); //探索・推薦タブを表示
            display_song(exp_song_id); // プレイヤー・評価ボタンの更新 + 表示中の楽曲タイトルを緑色に変更

            $('#explore-playlist').trigger('click');
            // console.log(listenSongID);
        } else {
            alert("このタブ内の楽曲を評価してください");
        }
    });

    // 探索タブのイベントリスナー
    function explore_song() {

        // 各カテゴリーのZ値が-0.3~0.3の曲を抽出
        const lyricCandidates = Object.values(lyric_scatterData).filter(song => song.lyric_value >= -0.3 && song.lyric_value <= 0.3 && !song.listen_flag);
        const vocalCandidates = Object.values(vocal_scatterData).filter(song => song.vocal_value >= -0.3 && song.vocal_value <= 0.3 && !song.listen_flag);
        const instCandidates = Object.values(inst_scatterData).filter(song => song.inst_value >= -0.3 && song.inst_value <= 0.3 && !song.listen_flag);

        // 各カテゴリの曲数を比較して最多（最少）カテゴリを選択
        const maxCount = Math.max(lyricCandidates.length, vocalCandidates.length, instCandidates.length);
        // const maxCount = Math.min(lyricCandidates.length, vocalCandidates.length, instCandidates.length);
        let candidateCategories = [];

        if (vocalCandidates.length === maxCount) {
            candidateCategories.push(vocalCandidates);
            // console.log("vocal");
        };
        if (instCandidates.length === maxCount) {
            candidateCategories.push(instCandidates);
            // console.log("accompaniment");
        };
        if (lyricCandidates.length === maxCount) {
            candidateCategories.push(lyricCandidates);
            // console.log("lyric");
        };
        // ランダムに1つのカテゴリから1曲選択
        if (candidateCategories.length > 0) {
            const selectedCategory = candidateCategories[Math.floor(Math.random() * candidateCategories.length)];
            const randomSong = selectedCategory[Math.floor(Math.random() * selectedCategory.length)];
            const nextSongId = randomSong.songid;
            // finalizeCurrentSongRatings(listenSongID);
            before_listenSongID = listenSongID;
            listenSongID = nextSongId; // 次の楽曲IDを設定

            // categoryごとのvalueの更新（計算時のZの前に持っていた値）
            if (songData[before_listenSongID].listen_flag === true){
                Object.entries(songData).forEach(([key, song]) => {
                    if (vocal_scatterData[key]) {
                        song.vocal_value = vocal_scatterData[key].Z_value;
                    }
                    if (inst_scatterData[key]) {
                        song.inst_value = inst_scatterData[key].Z_value;
                    }
                    if (lyric_scatterData[key]) {
                        song.lyric_value = lyric_scatterData[key].Z_value;
                    }
                });    
            }
            // console.log("ExploreSong:"+ nextSongId);
            return nextSongId;
        }
    }

    // 推薦タブのイベントリスナー
    function recommend_songs() {
        const sumData = {};
        const allSongIDs = Object.keys(vocal_scatterData);

        allSongIDs.forEach(songID => {
            const isListened = vocal_scatterData[songID]?.listen_flag === false;

            if (isListened) {
                const vocalZ = vocal_scatterData[songID]?.Z_value ?? 0;
                const instZ = inst_scatterData[songID]?.Z_value ?? 0;
                const lyricZ = lyric_scatterData[songID]?.Z_value ?? 0;

                sumData[songID] = {
                    songid: songID,
                    title: vocal_scatterData[songID]?.title,
                    writer: vocal_scatterData[songID]?.writer,
                    thumbnail: vocal_scatterData[songID]?.thumbnail,
                    total_Z_value: (vocalZ + instZ + lyricZ) / 3
                };
            }
        });

        const sortedSongZ = Object.values(sumData).sort((a, b) => b.total_Z_value - a.total_Z_value);
        // console.log(sortedSongZ.slice(0, 5));

        // 平均Z値が全て0の場合
        // if (sortedSongZ.every(song => song.total_Z_value === 0)) {
        //     return; // 評価済みのデータがなければ何もせず終了
        // }

        // let nextSongId;
        // if (!songData[listenSongID]?.listen_flag) {
        //     // 現在の楽曲が未評価 → 楽曲変更せず終了
        //     nextSongId = listenSongID;
        // } else {
        //     // 通常通り推薦結果を採用
        //     nextSongId = sortedSongZ[0].songid;
        // }

        before_listenSongID = listenSongID;
        // categoryごとのvalueの更新
        if (songData[before_listenSongID].listen_flag === true){
            Object.entries(songData).forEach(([key, song]) => {
                if (vocal_scatterData[key]) {
                    song.vocal_value = vocal_scatterData[key].Z_value;
                }
                if (inst_scatterData[key]) {
                    song.inst_value = inst_scatterData[key].Z_value;
                }
                if (lyric_scatterData[key]) {
                    song.lyric_value = lyric_scatterData[key].Z_value;
                }
            });    
        }
        return sortedSongZ.slice(0, 5);
    }

    // 探索結果の楽曲を表示する関数
    function render_exp_song(exp_song_id) {
        let exp_song = songData[exp_song_id];

        const expHTML = `
            <div class="exp-song-item" data-songid="${exp_song_id}">
                <div class="song-main">
                    <div class="song-icon">
                        <img src="${exp_song.thumbnail}"></img>
                    </div>
                    <div class="song-text">
                        <div class="song-title">${exp_song.title}
                            <div class="song-writer">${exp_song.writer}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="next-song-button">
                <div class="next-song-text">NEXT SONG</div>
            </div>
            `;
        $('#exp-song-content').html(expHTML);
    }

    // 推薦結果のプレイリストを表示する関数
    function render_rec_songs(top5_songs) {
        const recHTML = `
            ${top5_songs.map((song, index) => `
                <div class="rec-song-item" data-songid="${song.songid}">
                    <div class="song-main">
                        <div class="song-rank">${index + 1}</div>
                        <div class="rec-song-icon">
                            <img src="${song.thumbnail}"></img>
                        </div>
                        <div class="rec-song-text">
                            <div class="song-title">${song.title}
                                <div class="song-writer">${song.writer}</div>
                            </div>
                        </div>
                    </div>
                </div>
                `).join('')}
        `;
        $('#rec-song-content').html(recHTML);

        // 未評価の中で最もインデックスが小さいものを取得
        const firstUnlistened = top5_songs.find(song => songData[song.songid]?.listen_flag === false);

        // 未評価がなければインデックス0の曲を再生、それもなければ先頭
        const targetSongId = firstUnlistened?.songid || top5_songs[0]?.songid || top5_songs[0]?.songid;

        if (targetSongId) {
            if (songData[listenSongID]?.listen_flag === true) {
                finalizeCurrentSongRatings(listenSongID);
            }

            display_song(targetSongId);
        }
    }

    // 楽曲の動画を表示
    function display_song(SongId) {
        // 評価値をその曲に応じて復元
        const song = songData[SongId];
        desiredMaxLyric = song.lyric_rating ?? null;
        desiredMaxVocal = song.vocal_rating ?? null;
        desiredMaxInst = song.inst_rating ?? null;
        // console.log(song);
        // console.log(desiredMaxVocal);

        $('.rating-button').removeClass('active');

        // 評価済み楽曲の時に、該当するボタンに .active を付ける
        ['vocal', 'inst', 'lyric'].forEach(target => {
            const rating = song[`${target}_rating`];
            // console.log(song);
            if (rating !== undefined && rating !== null) {
                const ratingStr = rating.toFixed(1);  // ex: 0 → "0.0"
                // console.log(ratingStr);
                $(`#${target}-evaluation .rating-button[data-value="${ratingStr}"]`).addClass('active');
            }
        });

        // プレイヤーと散布図の更新
        songle_player(SongId);
        unevaluatedScatterPlotColors(SongId);
        
        // 楽曲名のハイライトを更新（緑に）
        $('.song-title').css('color', ''); // 全てリセット
        $(`#exp-song-content .exp-song-item[data-songid="${SongId}"] .song-title`).css('color', 'rgba(73,211,85,0.88)');
        $(`#rec-song-content .rec-song-item[data-songid="${SongId}"] .song-title`).css('color', 'rgba(73,211,85,0.88)');
    }

    // 未評価要素を0に確定してから次の曲へ進む
    function finalizeCurrentSongRatings(songId) {
        if (!songId) return;
        // 1つも評価してない曲は対象外（従来の挙動を保持）
        if (songData[songId]?.listen_flag !== true) return;

        ['vocal','inst','lyric'].forEach(cat => {
            if (songData[songId][`${cat}_rating`] == null) {
                // 楽曲本体
                songData[songId][`${cat}_rating`] = 0.0;
                songData[songId][`${cat}_value`]  = 0.0;

                // 表示用scatterData側
                const sd = (cat === 'vocal') ? vocal_scatterData
                    : (cat === 'inst')  ? inst_scatterData
                    :                     lyric_scatterData;

                if (sd[songId]) {
                    sd[songId][`${cat}_rating`] = 0.0;
                    sd[songId][`${cat}_value`]  = 0.0;
                    sd[songId].Z_value = 0.0;
                    sd[songId].listen_flag = true;
                }
            }
        });

        // 曲自体のlisten_flagを統一（各散布図側も合わせる）
        songData[songId].listen_flag = true;
        if (vocal_scatterData[songId]) vocal_scatterData[songId].listen_flag = true;
        if (inst_scatterData[songId])  inst_scatterData[songId].listen_flag  = true;
        if (lyric_scatterData[songId]) lyric_scatterData[songId].listen_flag = true;
        
        console.log("評価した楽曲数：" + Object.values(songData).filter(s => s.listen_flag === true).length);
    }

    // 散布図データ作成
    function createScatterData(songData, category) {
        return Object.fromEntries(
            Object.entries(songData).map(([key, song]) => {
                const pos = song.position[mapType][category];
                const scatterPoint = {
                    songid: key,
                    x: pos[0],
                    y: pos[1],
                    title: song.title,
                    writer: song.writer,
                    url: song.url,
                    thumbnail: song.thumbnail,
                    listen_flag: song.listen_flag,
                    Z_value: song[`${category}_value`],

                    // カテゴリごとの情報
                    [`${category}_value`]: song[`${category}_value`],
                    [`${category}_sigma`]: song[`${category}_sigma`],
                    [`${category}_rating`]: song[`${category}_rating`],
                };
                return [key, scatterPoint];
            })
        );
    }


    // 散布図を描画する関数
    function renderScatterPlot(canvasId, scatterData, category) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const chart = new Chart(ctx, {
            type: 'scatter',
            data: { 
                datasets: [
                    { 
                        label: '曲', 
                        data: scatterData, 
                        backgroundColor: scatterData.map(() => 'rgba(0,0,0,0.75)'), 
                        pointRadius: scatterData.map(() => 1.65),
                    }] 
            },
            options: {
                maintainAspectRatio: false,
                layout: { padding: 20 },
                animation: { duration: 0 },
                scales: { 
                    x: { display: false }, 
                    y: { display: false } 
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { 
                            label: (tooltipItem) => {
                                const dataPoint = tooltipItem.raw;
                                return [
                                    `${dataPoint.title}`,
                                     `${dataPoint.writer}`,
                                     `listen_flag = ${dataPoint.listen_flag}`,
                                     `${category}_value = ${dataPoint[category + "_value"]}`,
                                     `Z = ${dataPoint.Z_value.toFixed(4)}`
                                    ];
                            }
                        },
                        mode: 'nearest',
                        intersect: true,
                        bodyFont: { size: 18, weight: 'bold' }
                    }
                },
                // マップ上で楽曲をクリックした際、プレイヤーに表示する楽曲を変更
                onClick: (evt, elements) => {
                    // listenSongIDがfirst_songIdときはマップのクリック不可
                    if (listenSongID === first_songId) {
                        alert("2曲目以降からマップのクリックが可能です！");
                        return
                    };

                    if (elements.length > 0) {
                        const chart = elements[0].element.$context.chart;
                        const dataIndex = elements[0].index;
                        const clickedSong = chart.data.datasets[0].data[dataIndex];
                        const clickedSongId = clickedSong.songid;

                        if (songData[listenSongID].listen_flag === true){
                            Object.entries(songData).forEach(([key, song]) => {
                                if (vocal_scatterData[key]) {
                                    song.vocal_value = vocal_scatterData[key].Z_value;
                                }
                                if (inst_scatterData[key]) {
                                    song.inst_value = inst_scatterData[key].Z_value;
                                }
                                if (lyric_scatterData[key]) {
                                    song.lyric_value = lyric_scatterData[key].Z_value;
                                }
                            });
                        }

                        finalizeCurrentSongRatings(listenSongID);
                        desiredMaxLyric = null;
                        desiredMaxVocal = null;
                        desiredMaxInst = null;
                        $('.rating-button').removeClass('active');
                        listenSongID = clickedSongId;

                        $('.first-song-area').show();
                        $('.exp-rec-area').hide();
                        updateFirstSongArea(clickedSongId);
                        display_song(clickedSongId);
                    }
                }
            }
        });
        return chart;
    }

    // マップ上の曲をクリックしたときに表示するエリア（first-song-areaのUIを再利用）
    function updateFirstSongArea(songId) {
        const song = songData[songId];
        const html = `
            <div class="annotation-text">SELECTED SONG</div>
            <div class="song-main">
                <div class="song-icon">
                    <img src="${song.thumbnail}"></img>
                </div>
                <div class="song-text">
                    <div class="song-title song-title-highlight">${song.title}
                        <div class="song-writer">${song.writer}</div>
                    </div>
                </div>
            </div>
        `;
        $('.first-song-area .song-info').html(html);  // .song-info をHTMLに用意しておく
    }

    // songleプレイヤーの表示
    function songle_player(songId) {       
        // var song_select_check = false; // 初期状態：プレイリストをクリックしていない
        // var selected_song = null; // クリックされた楽曲（初期状態は無し）

        const url = songData[songId].url; // 楽曲URL
        listenSongID = songId; // クリックされた曲のIDを保存

        // songle 読み込み
        $('#player').html(`
            <div data-api="songle-widget-extra-module" data-url="${url}" id="songle-widget" data-songle-widget-ctrl="0" data-api-chorus-auto-reload="1" data-song-start-at="chorus"
            data-video-player-size-w="${player_weight}" data-video-player-size-h="${video_player_height}" data-songle-widget-size-w="${player_weight}" data-songle-widget-size-h="100"></div>
        `);
        $.getScript("https://widget.songle.jp/v1/widgets.js"); // songle プレイヤーを表示
        
        // ページ移動時に一度だけ実行
        if (!called){
            unevaluatedScatterPlotColors(songId); // 散布図の色を更新
            called = true;
        }
        // song_select_check = true;
        // selected_song = $(this); // 現在選択された楽曲を記録
    }

    // Z計算関数
    function calculateZ(x, y, mu_x, mu_y, sigma, desiredMax, coef) {
        // desiredMax = w
        // coef = 1/2πσ^2
        const dx = (x - mu_x);
        const dy = (y - mu_y);
        const Z_raw = coef * Math.exp(-0.5 * ((dx * dx + dy * dy) / (sigma * sigma)));
        return (Z_raw / coef) * desiredMax;
    } 

    // 各カテゴリごとに「どの曲を中心に・どんなパラメータで」最後に寄与したかを覚える
    // 例: contributionParams.vocal["sm123"] = { sigma, desiredMax }
    const contributionParams = { vocal: {}, inst: {}, lyric: {} };

    // 各カテゴリで「どの評価済み曲(=センター)が各ターゲット曲に何点寄与したか」を保持
    // 例: centerContribs.vocal["sm123"][targetId] = 寄与値
    const centerContribs = { vocal: {}, inst: {}, lyric: {} };

    /** 寄与の集約方法（concatTypeで切替） */
    function combineContribs(values) {
        if (concatType === "MaxMin") {
            // 最大の正寄与と、最小の負寄与のみを採用
            let maxPos = 0;
            let minNeg = 0;
            for (const v of values) {
                if (v > maxPos) maxPos = v;
                if (v < minNeg) minNeg = v;
            }
            return maxPos + minNeg;
        }
        // 既定: 総和（AllPattern）
        return values.reduce((s, v) => s + v, 0);
    }

    /** あるカテゴリの全ターゲット曲について、保持中の寄与を合成してZを更新 */
    function recomputeCategoryZ(category) {
        const sd = (category === 'vocal') ? vocal_scatterData
                : (category === 'inst')  ? inst_scatterData
                :                          lyric_scatterData;
        const centers = centerContribs[category];

        Object.keys(sd).forEach(targetId => {
            const p = sd[targetId];
            if (p.listen_flag === true) return;  // 評価済みは変更しない

            const vs = [];
            // すべてのセンターから、このターゲットへの寄与を集める
            for (const cId in centers) {
                const v = centers[cId][targetId];
                if (v !== undefined) vs.push(v);
            }
            const z = combineContribs(vs);
            songData[targetId][`${category}_value`] = z;
            p[`${category}_value`] = z;
            p.Z_value = z;
        });
    }

    // 要素ごとの各楽曲にガウス分布を付与する関数（個別に許容度設定）
    function EachGiveZ_value(category) {
        // 対象カテゴリのパラメータ
        const sd = (category === 'vocal') ? vocal_scatterData
            : (category === 'inst')  ? inst_scatterData
            :                          lyric_scatterData;

        const sigma = (category === 'vocal') ? (vocal_sigma / 1000)
                    : (category === 'inst')  ? (inst_sigma / 1000)
                    :                          (lyric_sigma / 1000);

        const desiredMax = (category === 'vocal') ? desiredMaxVocal
                        : (category === 'inst')  ? desiredMaxInst
                        :                        desiredMaxLyric;

        if (concatType === 'AllPattern') {
            // μ：listenSong の座標
            const muPoint = sd[listenSongID];
            const mu_x = muPoint.x;
            const mu_y = muPoint.y;

            // 係数： 1/(2πσ^2) 
            const coef = 1 / (2 * Math.PI * sigma * sigma);

            // 前回、この中心曲で寄与したときのパラメータ（あれば差し引く）
            const prev = contributionParams[category][listenSongID];

            Object.values(sd).forEach(p => {
                if (p.listen_flag === true) return; // 評価済みの曲の値は変更しない

                const key = p.songid;
                // これまでの合計（songData 側を真に、scatterData 側は表示用に同期）
                let base = songData[key][`${category}_value`] || 0.0;

                // 1) 同じ中心曲の前回寄与を引く（差し替え対応）
                if (prev) {
                    const prevCoef = 1 / (2 * Math.PI * prev.sigma * prev.sigma);
                    const oldContrib = calculateZ(p.x, p.y, mu_x, mu_y, prev.sigma, prev.desiredMax, prevCoef);
                    base -= oldContrib;
                }

                // 2) 今回の寄与を足す
                const newContrib = calculateZ(p.x, p.y, mu_x, mu_y, sigma, desiredMax, coef);
                const total = base + newContrib;

                // 3) 反映（合計値を保存）
                songData[key][`${category}_value`] = total;
                p[`${category}_value`] = total;
                p.Z_value = total;
            });

            // この中心曲の最新パラメータを記録
            contributionParams[category][listenSongID] = { sigma, desiredMax };
        } else if (concatType === 'MaxMin') {
            const mu = sd[listenSongID];
            if (!mu || desiredMax == null) return;

            const coef = 1 / (2 * Math.PI * sigma * sigma);

            // このセンターの寄与テーブルを確保
            const centerId = listenSongID;
            if (!centerContribs[category][centerId]) centerContribs[category][centerId] = {};
            const table = centerContribs[category][centerId];

            // このセンターから全ターゲットへの寄与を更新
            Object.values(sd).forEach(p => {
                if (p.listen_flag === true) return; // 評価済みは変えない
                const v = calculateZ(p.x, p.y, mu.x, mu.y, sigma, desiredMax, coef);
                table[p.songid] = v; // 上書きでOK
            });

            // 集約してZを再計算
            recomputeCategoryZ(category);
        }
    }

    // 要素ごとの各楽曲にガウス分布を付与する関数（各楽曲で同じ許容度設定）
    function AllGiveZ_value(category) {
        // 対象カテゴリの scatterData と現在のσ
        const sd = (category === 'vocal') ? vocal_scatterData
            : (category === 'inst')  ? inst_scatterData
            :                          lyric_scatterData;

        const sigma = (category === 'vocal') ? (vocal_sigma / 1000)
                    : (category === 'inst')  ? (inst_sigma / 1000)
                    :                          (lyric_sigma / 1000);

        const coef = 1 / (2 * Math.PI * sigma * sigma);

        if (concatType === 'AllPattern') {
            // 1) いったん未評価曲の合計値をリセット
            Object.values(sd).forEach(p => {
                if (p.listen_flag === true) return;  // 評価済は触らない
                songData[p.songid][`${category}_value`] = 0.0;
                p[`${category}_value`] = 0.0;
                p.Z_value = 0.0;
            });

            // 2) このカテゴリで「評価済みの楽曲＝中心曲」を全部集める
            const centers = Object.values(sd).filter(c =>
                songData[c.songid][`${category}_rating`] != null
            );

            // 3) すべての中心曲から、未評価曲へ寄与を再加算
            centers.forEach(center => {
                const mu_x = center.x;
                const mu_y = center.y;
                const desiredMax = songData[center.songid][`${category}_rating`];

                Object.values(sd).forEach(p => {
                    if (p.listen_flag === true) return;  // 評価済は変えない
                    const contrib = calculateZ(p.x, p.y, mu_x, mu_y, sigma, desiredMax, coef);
                    const total = (songData[p.songid][`${category}_value`]) + contrib;

                    songData[p.songid][`${category}_value`] = total;
                    p[`${category}_value`] = total;
                    p.Z_value = total;
                });
            });

            // 4) 見た目を更新（未評価の水色維持ロジックも尊重）
            selectedScatterPlotColors(listenSongID, category);
        } else if (concatType === 'MaxMin') {
            // リセット（評価済みの表示値は触らない）
            Object.values(sd).forEach(p => {
                if (p.listen_flag === true) return;
                songData[p.songid][`${category}_value`] = 0.0;
                p[`${category}_value`] = 0.0;
                p.Z_value = 0.0;
            });

            // センター候補（このカテゴリで評価値がある曲）
            const centers = Object.values(sd).filter(c =>
                songData[c.songid][`${category}_rating`] != null
            );

            // センター別寄与テーブルを作り直す
            centerContribs[category] = {};
            centers.forEach(center => {
                const desiredMax = songData[center.songid][`${category}_rating`];
                const cId = center.songid;
                centerContribs[category][cId] = {};
                const table = centerContribs[category][cId];

                Object.values(sd).forEach(p => {
                    if (p.listen_flag === true) return;
                    const v = calculateZ(p.x, p.y, center.x, center.y, sigma, desiredMax, coef);
                    table[p.songid] = v;
                });
            });

            // 集約してZを再計算
            recomputeCategoryZ(category);

            // 見た目更新
            selectedScatterPlotColors(listenSongID, category);
        }
    }


    // 未評価楽曲を表示する時にマップの色を更新する関数
    function unevaluatedScatterPlotColors(selectedSongId) {
        const CYAN = 'rgb(77, 196, 255)';

        [myChartLyric, myChartVocal, myChartInst].forEach(chart => {
            if (!chart) return;

            const ds = chart.data.datasets[0];
            const data = ds.data.slice(); // 破壊を避けてコピー

            // 選択点を最後に移動（前面に描画）
            const idx = data.findIndex(p => p.songid === selectedSongId);
            if (idx !== -1) {
                const sel = data.splice(idx, 1)[0];
                data.push(sel);
            }

            // 色・半径・枠線を更新
            ds.data = data;
            ds.backgroundColor = data.map(p => {
                const isSelected = p.songid === selectedSongId;
                const isUnlistened = p.listen_flag === false;
                if (isSelected && isUnlistened) return CYAN; // 未評価の選択点だけ水色
                const z = Number(p.Z_value ?? 0);
                if (z >= 1)  return d3.interpolateRdYlGn(0.9);
                if (z <= -1) return d3.interpolateRdYlGn(0.1);
                return d3.interpolateRdYlGn(0.4 * z + 0.5);
            });
            ds.pointRadius = data.map(p =>
                (p.songid === selectedSongId) ? 6.5 : (p.listen_flag ? 4.5 : 1.65) // 評価済みなら中サイズ、未評価なら小
            );
            ds.borderColor = data.map(p =>
                p.listen_flag ? CYAN : 'rgba(0,0,0,0)' // 円周の色設定
            );
            ds.borderWidth = data.map(p =>
                (p.songid === selectedSongId || p.listen_flag) ? 2.5 : 0 // 円周の太さ設定
            );

            chart.update();
        });
    }

    // 楽曲を評価時・許容度を変更時にマップの色を変更する関数（要素ごとに処理）
    function selectedScatterPlotColors(selectedSongId, category) {
        const CYAN = 'rgb(77, 196, 255)'; // 評価直後に目立たせる色

        // 対象カテゴリの scatterData / chart を取得
        const sd    = category === 'vocal' ? vocal_scatterData
                    : category === 'inst'  ? inst_scatterData
                    :                        lyric_scatterData;

        // 未評価のときにスライダを動かしても，水色の点を維持する
        if (sd[selectedSongId]?.listen_flag === false) {
            unevaluatedScatterPlotColors(selectedSongId);
            console.log("楽曲が未評価でスライダを動かしています");
            return;
        }

        const chart = category === 'vocal' ? myChartVocal
                    : category === 'inst'  ? myChartInst
                    :                        myChartLyric;

        // データを配列化し、選択点を最後にして前面へ
        const data = Object.values(sd);
        const idx = data.findIndex(p => p.songid === selectedSongId);
        if (idx !== -1) { const sel = data.splice(idx, 1)[0]; data.push(sel); }

        // チャートへ反映
        const ds = chart.data.datasets[0];
        ds.data = data;
        ds.backgroundColor = data.map(p => {
            const z = Number(p.Z_value ?? 0);
            if (z >= 1)  return d3.interpolateRdYlGn(0.9);
            if (z <= -1) return d3.interpolateRdYlGn(0.1);
            return d3.interpolateRdYlGn(0.4 * z + 0.5);
        });
        ds.pointRadius = data.map(p =>
            (p.songid === selectedSongId) ? 6.5 : (p.listen_flag ? 4.5 : 1.65) // 評価済みなら中サイズ、未評価なら小
        );
        ds.borderColor = data.map(p =>
            p.listen_flag ? CYAN : 'rgba(0,0,0,0)' // 円周の色設定
        );
        ds.borderWidth = data.map(p =>
            (p.songid === selectedSongId || p.listen_flag) ? 2.5 : 0 // 円周の太さ設定
        );
        chart.update();
    }

    $('#loading').fadeOut();
});