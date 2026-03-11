// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 設定靜態檔案資料夾 (我們等一下會建立這個資料夾放網頁)
app.use(express.static('public'));

let scores = { conservative: 0, aggressive: 0 };
let isVotingActive = false;

io.on('connection', (socket) => {
    // 新連線時，同步目前狀態
    socket.emit('update_score', scores);
    socket.emit('voting_status', isVotingActive);

    // 接收手機端的點擊
    socket.on('vote', (type) => {
        // 結算防呆：只有在開放投票期間，點擊才有效
        if (isVotingActive && (type === 'conservative' || type === 'aggressive')) {
            scores[type]++;
            io.emit('update_score', scores); // 即時廣播給所有人（包含 PPT 大螢幕）
        }
    });

    // 接收大螢幕的「開始」指令
    socket.on('start_voting', () => {
        // 重整需刪除：每次開始都清空舊數據
        scores = { conservative: 0, aggressive: 0 };
        isVotingActive = true;
        io.emit('update_score', scores);
        io.emit('voting_status', true);

        // 嚴格控制 3 秒後結算防呆
        setTimeout(() => {
            isVotingActive = false;
            io.emit('voting_status', false); // 通知手機端鎖死按鈕
            
            // 判定結果
            let winner = '平手！大腦當機啦！';
            if (scores.conservative > scores.aggressive) winner = '保守治療 取得控制權！';
            if (scores.aggressive > scores.conservative) winner = '積極治療 取得控制權！';
            io.emit('show_result', winner);
        }, 3000); // 3000 毫秒 = 3 秒
    });
});

// 啟動伺服器，監聽 3000 port
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`大腦控制台伺服器已啟動！請在瀏覽器輸入 http://localhost:${PORT} 開啟大螢幕`);
});