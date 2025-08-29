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

    let evaluatedSongMap = {};  // 評価された曲をsongidごとに1つだけ保持
    let evaluationOrder = 1;    // 評価順インクリメント用

    // スライダーで調整した際の更新
    $('#slider1').on('input', function() {
        vocal_sigma = $(this).val();
        // console.log("vocal:"+ vocal_sigma/1000);
        updateSingleScatterPlotColors(listenSongID, "vocal");
    });
    $('#slider2').on('input', function() {
        inst_sigma = $(this).val();
        // console.log("accompaniment:"+ inst_sigma/1000);
        updateSingleScatterPlotColors(listenSongID, "inst");
    });
    $('#slider3').on('input', function() {
        lyric_sigma = $(this).val();
        // console.log("lyrics:"+ lyric_sigma/1000);
        updateSingleScatterPlotColors(listenSongID, "lyric");
    });
    
    let listen_position = songData[listenSongID].position[mapType];
    
    // songData：配列型の楽曲データ（例：songData["sm15630734"] = 千本桜に関する全データ）
    vocal_scatterData = createScatterData(songData, "vocal", listen_position.vocal[0], listen_position.vocal[1], vocal_sigma);
    inst_scatterData = createScatterData(songData, "inst", listen_position.inst[0], listen_position.inst[1], inst_sigma);
    lyric_scatterData = createScatterData(songData, "lyric", listen_position.lyric[0], listen_position.lyric[1], lyric_sigma);
    // console.log(vocal_scatterData);

    myChartVocal = renderScatterPlot("vocal-scatter", Object.values(vocal_scatterData), "vocal");
    myChartInst = renderScatterPlot("inst-scatter", Object.values(inst_scatterData), "inst");
    myChartLyric = renderScatterPlot("lyric-scatter", Object.values(lyric_scatterData), "lyric");

    songle_player(listenSongID); // songleプレイヤーの表示

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
            desiredMaxVocal = value;
        } else if (parentDivId === 'inst-evaluation') {
            desiredMaxInst = value;
        } else if (parentDivId === 'lyric-evaluation') {
            desiredMaxLyric = value;
            // console.log(desiredMaxLyric);
        }

        // 現在選択されている楽曲のlisten_flagをtrueに設定
        if (listenSongID && songData[listenSongID]) {
            songData[listenSongID].listen_flag = true;
        }

        // マップを更新
        updateScatterPlotColors(listenSongID);
    });

    // 事前選択の楽曲表示タブから、探索・推薦タブへ表示切り替え
    $('.next-song-button').on('click', function () {
        // 楽曲を評価したか
        if (songData[listenSongID]?.listen_flag === true) {
            // save_current_song_state(); // 評価結果の保存

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

    // 探索タブ切り替え処理
    $('#explore-playlist').on('click', function () {
        if ($(this).hasClass('select-type')) return;  // タブの連打防止
        save_current_song_state();

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
        if (songData[listenSongID]?.listen_flag === true) {
            save_current_song_state();
        }

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
        const clickedSongId = $(this).data('songid');
        if (clickedSongId) {
            save_current_song_state();
            display_song(clickedSongId);
        }
    });

    // 表示される楽曲が変わる際に，元々表示されていた楽曲の評価内容と許容度を保存 (songData内)
 function save_current_song_state() {
    if (!listenSongID || !songData[listenSongID]) return;

    let song = songData[listenSongID];

    // 変更があったかを判定
    let hasChanged =
        song.lyric_rating !== desiredMaxLyric ||
        song.vocal_rating !== desiredMaxVocal ||
        song.inst_rating !== desiredMaxInst ||
        song.lyric_sigma !== lyric_sigma ||
        song.vocal_sigma !== vocal_sigma ||
        song.inst_sigma !== inst_sigma;

    // listen_flagがtrueで、かつ評価・許容度に変更がない場合は保存スキップ
    if (song.listen_flag === true && !hasChanged) {
        // console.log("確認");
        return;
    }

    // 評価値の保存
    song.lyric_rating = desiredMaxLyric;
    song.vocal_rating = desiredMaxVocal;
    song.inst_rating = desiredMaxInst;

    // 許容度の保存
    song.lyric_sigma = lyric_sigma;
    song.vocal_sigma = vocal_sigma;
    song.inst_sigma = inst_sigma;

    // listen_flagを立てる（未評価→評価済みになった場合）
    song.listen_flag = true;

    // マップ上のZ値を保存
    Object.entries(songData).forEach(([key, s]) => {
        if (vocal_scatterData[key]) {
            s.vocal_value = vocal_scatterData[key].Z_value;
        }
        if (inst_scatterData[key]) {
            s.inst_value = inst_scatterData[key].Z_value;
        }
        if (lyric_scatterData[key]) {
            s.lyric_value = lyric_scatterData[key].Z_value;
        }
    });
}

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

        // 評価済みの時、該当するボタンに .active を付ける
        ['lyric', 'vocal', 'inst'].forEach(target => {
            const rating = song[`${target}_rating`];
            if (rating !== undefined && rating !== null) {
                const ratingStr = rating.toFixed(1);  // ex: 0 → "0.0"
                // console.log(ratingStr);
                $(`#${target}-evaluation .rating-button[data-value="${ratingStr}"]`).addClass('active');
            }
        });

        // プレイヤーと散布図の更新
        songle_player(SongId);
        updateScatterPlotColors(SongId);
        
        // 楽曲名のハイライトを更新（緑に）
        $('.song-title').css('color', ''); // 全てリセット
        $(`#exp-song-content .exp-song-item[data-songid="${SongId}"] .song-title`).css('color', 'rgba(73,211,85,0.88)');
        $(`#rec-song-content .rec-song-item[data-songid="${SongId}"] .song-title`).css('color', 'rgba(73,211,85,0.88)');
    }

    // ガウス分布も含めた全体のデータ
    function createScatterData(songData, category, mu_x, mu_y, sigma, forceUpdate = false) {
        let song = songData[listenSongID];

        let hasChanged =
            song.lyric_rating !== desiredMaxLyric ||
            song.vocal_rating !== desiredMaxVocal ||
            song.inst_rating !== desiredMaxInst ||
            song.lyric_sigma !== lyric_sigma ||
            song.vocal_sigma !== vocal_sigma ||
            song.inst_sigma !== inst_sigma;

        if (!forceUpdate && song.listen_flag === true && !hasChanged) {
            // 既存のZ値を含むデータ構造をそのまま返す（再計算なし）
            return Object.fromEntries(
                Object.entries(songData).map(([key, song]) => {
                    const pos = song.position[mapType][category];
                    return [
                        key,
                        {
                            songid: key,
                            x: pos[0],
                            y: pos[1],
                            title: song.title,
                            writer: song.writer,
                            url: song.url,
                            thumbnail: song.thumbnail,
                            listen_flag: song.listen_flag,
                            vocal_value: song.vocal_value,
                            inst_value: song.inst_value,
                            lyric_value: song.lyric_value,
                            vocal_sigma: song.vocal_sigma,
                            inst_sigma: song.inst_sigma,
                            lyric_sigma: song.lyric_sigma,
                            vocal_rating: song.vocal_rating,
                            inst_rating: song.inst_rating,
                            lyric_rating: song.lyric_rating,
                            Z_value: song[`${category}_value`]
                        }
                    ];
                })
            );
        }

        // Z値再計算する通常処理 ↓
        const desiredMaxMap = {
            vocal: desiredMaxVocal,
            inst: desiredMaxInst,
            lyric: desiredMaxLyric
        };
        const desiredMax = desiredMaxMap[category];
        const sigmaScaled = sigma / 1000;
        const coef = 1 / (2 * Math.PI * sigmaScaled * sigmaScaled);

        return Object.fromEntries(
            Object.entries(songData).map(([key, song]) => {
                const pos = song.position[mapType][category];
                const baseValue = song[`${category}_value`];
                let Z_value = 0;

                if (key === listenSongID) {
                    // 選択中の楽曲：評価ボタンがあれば反映
                    Z_value = desiredMax !== null ? calculateZ(pos[0], pos[1], mu_x, mu_y, sigmaScaled, desiredMax, coef) : 0;

                    // 評価記録：初回ならorderを記録
                    if (!(key in evaluatedSongMap)) {
                        evaluatedSongMap[key] = { order: evaluationOrder++ };
                    }

                    Object.assign(evaluatedSongMap[key], {
                        songid: key,
                        vocal_rating: desiredMaxVocal,
                        inst_rating: desiredMaxInst,
                        lyric_rating: desiredMaxLyric,
                        vocal_sigma: vocal_sigma,
                        inst_sigma: inst_sigma,
                        lyric_sigma: lyric_sigma
                    });

                } else if (song.listen_flag === true) {
                    // 評価済みの楽曲：base値のみ
                    Z_value = baseValue;
                } else {
                    // その他の楽曲：base + Z
                    Z_value = baseValue + (desiredMax !== null ? calculateZ(pos[0], pos[1], mu_x, mu_y, sigmaScaled, desiredMax, coef) : 0);
                }

                return [
                    key,
                    {
                        songid: key,
                        x: pos[0],
                        y: pos[1],
                        title: song.title,
                        writer: song.writer,
                        url: song.url,
                        thumbnail: song.thumbnail,
                        listen_flag: song.listen_flag,
                        vocal_value: song.vocal_value,
                        inst_value: song.inst_value,
                        lyric_value: song.lyric_value,
                        vocal_sigma: song.vocal_sigma,
                        inst_sigma: song.inst_sigma,
                        lyric_sigma: song.lyric_sigma,
                        vocal_rating: song.vocal_rating,
                        inst_rating: song.inst_rating,
                        lyric_rating: song.lyric_rating,
                        Z_value: Z_value
                    }
                ];
            })
        );
    }

    // ガウス分布の計算部分
    function calculateZ(x, y, mu_x, mu_y, sigma, desired_max, coef) {
        const dx = (x - mu_x);
        const dy = (y - mu_y);
        const Z_raw = coef * Math.exp(-0.5 * ((dx * dx + dy * dy) / (sigma * sigma)));

        // 中心 (mu_x, mu_y) のZ値をdesired_maxに設定
        return (Z_raw / coef) * desired_max;
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
                                     `${dataPoint.writer}`
                                    //  `listen_flag = ${dataPoint.listen_flag}`,
                                    //  `${category}_value = ${dataPoint[category + "_value"]}`,
                                    //  `Z = ${dataPoint.Z_value.toFixed(4)}`
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
        var song_select_check = false; // 初期状態：プレイリストをクリックしていない
        var selected_song = null; // クリックされた楽曲（初期状態は無し）

        const url = songData[songId].url; // 楽曲URL
        listenSongID = songId; // クリックされた曲のIDを保存

        // songle 読み込み
        $('#player').html(`
            <div data-api="songle-widget-extra-module" data-url="${url}" id="songle-widget" data-songle-widget-ctrl="0" data-api-chorus-auto-reload="1" data-song-start-at="0"
            data-video-player-size-w="${player_weight}" data-video-player-size-h="${video_player_height}" data-songle-widget-size-w="${player_weight}" data-songle-widget-size-h="100"></div>
        `);
        $.getScript("https://widget.songle.jp/v1/widgets.js"); // songle プレイヤーを表示
        
        // ページ移動時に一度だけ実行
        if (!called){
            updateScatterPlotColors(songId); // 散布図の色を更新
            called = true;
        }
        song_select_check = true;
        selected_song = $(this); // 現在選択された楽曲を記録
    }

    // 散布図の点の色と大きさを更新する関数
    function updateScatterPlotColors(selectedSongId) {
        // console.log("確認");
        // console.log(songData[selectedSongId]);
        const selectedSong = songData[selectedSongId].position[mapType];

        // 新しい散布データを作成し直す
        vocal_scatterData = createScatterData(songData, "vocal", selectedSong.vocal[0], selectedSong.vocal[1], vocal_sigma);
        inst_scatterData = createScatterData(songData, "inst", selectedSong.inst[0], selectedSong.inst[1], inst_sigma);
        lyric_scatterData = createScatterData(songData, "lyric", selectedSong.lyric[0], selectedSong.lyric[1], lyric_sigma);

        // グラフを更新
        myChartLyric.data.datasets[0].data = Object.values(lyric_scatterData);
        myChartVocal.data.datasets[0].data = Object.values(vocal_scatterData);
        myChartInst.data.datasets[0].data = Object.values(inst_scatterData);

        // グラフを更新
        [myChartLyric, myChartVocal, myChartInst].forEach(chart => {
            if (!chart) return;

            let data = chart.data.datasets[0].data;

            // 選択中の点を最後に移動（描画順で最前面になる）
            const selectedIndex = data.findIndex(song => song.songid === selectedSongId);
            if (selectedIndex !== -1) {
                const selectedSong = data.splice(selectedIndex, 1)[0];
                data.push(selectedSong);
            }

            const updated = data.map(song => {
                const baseColor = song.Z_value >= 1
                    ? d3.interpolateRdYlGn(0.9)
                    : song.Z_value <= -1
                        ? d3.interpolateRdYlGn(0.1)
                        : d3.interpolateRdYlGn((0.4 * song.Z_value) + 0.5);

                const isSelected = song.songid === selectedSongId;
                const isListened = song.listen_flag;

                return {
                    radius: isSelected
                        ? 6.5                          // 現在聴取中の曲 → 最大サイズ
                        : (isListened ? 5.5 : 1.65),  // 評価済みなら中サイズ、未評価なら小
                    borderColor: isListened ? 'rgb(77, 196, 255)' : 'rgba(0,0,0,0)', // 円周の色設定
                    borderWidth: isSelected || isListened ? 2.5 : 0, // 円周の太さ設定
                    backgroundColor: isSelected && !isListened  // 楽曲点の色
                        ? 'rgb(77, 196, 255)'
                        : baseColor
                };
            });

            chart.data.datasets[0].data = data; // 再代入
            chart.data.datasets[0].pointRadius = updated.map(p => p.radius);  
            chart.data.datasets[0].borderColor = updated.map(p => p.borderColor);
            chart.data.datasets[0].borderWidth = updated.map(p => p.borderWidth);
            chart.data.datasets[0].backgroundColor = updated.map(p => p.backgroundColor);

            chart.update();
        });
    }

    function updateSingleScatterPlotColors(selectedSongId, category) {
        const selectedSong = songData[selectedSongId].position[mapType];

        let scatterData, chart, sigma;
        if (category === 'vocal') {
            sigma = vocal_sigma;
            scatterData = createScatterData(songData, "vocal", selectedSong.vocal[0], selectedSong.vocal[1], sigma);
            chart = myChartVocal;
            vocal_scatterData = scatterData;
        } else if (category === 'inst') {
            sigma = inst_sigma;
            scatterData = createScatterData(songData, "inst", selectedSong.inst[0], selectedSong.inst[1], sigma);
            chart = myChartInst;
            inst_scatterData = scatterData;
        } else if (category === 'lyric') {
            sigma = lyric_sigma;
            scatterData = createScatterData(songData, "lyric", selectedSong.lyric[0], selectedSong.lyric[1], sigma);
            chart = myChartLyric;
            lyric_scatterData = scatterData;
        }

        const scatterArray = Object.values(scatterData);
        chart.data.datasets[0].data = scatterArray;

        chart.data.datasets[0].backgroundColor = scatterArray.map(song => {
            if (song.songid === selectedSongId && song.listen_flag === false) {
                return 'rgb(77, 196, 255)';
            } else if (song.Z_value >= 1) {
                return d3.interpolateRdYlGn(0.9);
            } else if (song.Z_value <= -1) {
                return d3.interpolateRdYlGn(0.1);
            } else {
                return d3.interpolateRdYlGn((0.4 * song.Z_value) + 0.5);
            }
        });

        chart.data.datasets[0].pointRadius = scatterArray.map(song => {
            return (song.songid === selectedSongId) ? 6 : 1.65;
        });

        chart.data.datasets[0].borderColor = scatterArray.map(song => {
            return song.listen_flag ? 'rgb(77, 196, 255)' : 'rgb(0, 0, 0, 0)';
        });

        chart.data.datasets[0].borderWidth = scatterArray.map(song => {
            if (song.songid === selectedSongId || song.listen_flag) {
                return 2;
            }
            return 0;
        });

        chart.update();
    }

    // exp-song-content 内に動的に挿入された NEXT SONG ボタンをクリックしたときの処理
    $(document).on('click', '#exp-song-content .next-song-button', function () {
        if (songData[listenSongID]?.listen_flag === true) {
            save_current_song_state();

            exp_song_id = explore_song();
            top5_songs = recommend_songs();

            // console.log(next_exp_song_id);
            // console.log(new_top5_songs);

            render_exp_song(exp_song_id);
            // render_rec_songs(top5_songs);
            display_song(exp_song_id);
        } else {
            alert("EXPLORE 楽曲を評価してください");
        }
    });

    $('#loading').fadeOut();

});

