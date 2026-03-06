// ▼▼▼ あなたのSupabaseの情報を貼り付けてください ▼▼▼
const SUPABASE_URL = 'https://dwzwrqfeabcdxbsqqmhh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_er0huDuAK294yBJKswQlMg_Gq1zmjbR';
// ▲▲▲ ▲▲▲ ▲▲▲

// Supabaseの準備（スプレッドシートのGASの代わりです）
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var currentPlayer = null;
var currentPlatform = '';

// 画面を開いた瞬間にURLを確認する
window.addEventListener('load', function() {
  var params = new URLSearchParams(window.location.search);
  var targetUrl = params.get('url');
  var targetClient = params.get('client');
  
  if (targetUrl && targetClient) {
    document.getElementById('videoUrl').value = targetUrl;
    document.getElementById('clientName').value = targetClient;
    
    var adminArea = document.getElementById('adminArea');
    if (adminArea) adminArea.style.display = 'none';
    
    loadVideo();
  }
  
  fetchList(); 
});

function loadAndGen() {
  var url = document.getElementById('videoUrl').value;
  var client = document.getElementById('clientName').value;
  if (!url || !client) return alert('動画URLとクライアント名の両方を入れてください');
  
  loadVideo();
  
  var baseUrl = window.location.href.split('?')[0];
  var fullShareUrl = baseUrl + '?url=' + encodeURIComponent(url) + '&client=' + encodeURIComponent(client);
  
  document.getElementById('shareUrl').value = fullShareUrl;
  document.getElementById('shareArea').classList.remove('hidden');
  
  fetchList();
}

function copyShareUrl() {
  var copyTarget = document.getElementById('shareUrl');
  copyTarget.select();
  document.execCommand("Copy");
  alert("コピーしました！これをクライアントに送ってください。");
}

function loadVideo() {
  var url = document.getElementById('videoUrl').value;
  var container = document.getElementById('player-container');
  container.innerHTML = ''; 

  if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) {
    currentPlatform = 'youtube';
    var videoId = url.indexOf('v=') !== -1 ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
    container.innerHTML = '<div id="yt-player"></div>';
    currentPlayer = new YT.Player('yt-player', { videoId: videoId, width: '100%', height: '100%' });
  } else if (url.indexOf('vimeo.com') !== -1) {
    currentPlatform = 'vimeo';
    var vimeoId = url.match(/\d+/)[0]; 
    container.innerHTML = '<div id="vimeo-player" style="width:100%;height:100%"></div>';
    currentPlayer = new Vimeo.Player('vimeo-player', { id: vimeoId, width: '100%', height: '100%' });
  }
}

async function captureTime() {
  if (!currentPlayer) return alert('先に動画を読み込んでください');
  var seconds = (currentPlatform === 'youtube') ? currentPlayer.getCurrentTime() : await currentPlayer.getCurrentTime();
  var min = Math.floor(seconds / 60).toString().padStart(2, '0');
  var sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  document.getElementById('timestamp').value = min + ":" + sec;
}

// 【Supabase版】データを送信する
async function submitFeedback() {
  var time = document.getElementById('timestamp').value;
  var msg = document.getElementById('comment').value;
  var vUrl = document.getElementById('videoUrl').value;
  var cName = document.getElementById('clientName').value;

  if (!time || !msg) return alert('入力してください');
  document.getElementById('submitBtn').innerText = "送信中...";
  
  try {
    // Supabaseの feedbacks テーブルに書き込む
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([
        { timestamp: time, comment: msg, video_url: vUrl, client_name: cName }
      ]);

    if (error) throw error; // エラーがあれば中断

    document.getElementById('comment').value = '';
    alert('送信完了！');
    setTimeout(fetchList, 1000);
  } catch (e) {
    console.error("エラー詳細:", e);
    alert('送信エラーが発生しました（RLSが解除されているか確認してください）');
  } finally {
    document.getElementById('submitBtn').innerText = "データを送信";
  }
}

// 【Supabase版】リストを取得して表示する
async function fetchList() {
  var list = document.getElementById('feedbackList');
  var currentVideoUrl = document.getElementById('videoUrl').value;
  
  try {
    // データベースから、今開いている動画URLと同じものだけを、新しい順で持ってくる
    let query = supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
    
    // もし画面に動画URLが入っていたら、それで絞り込む
    if (currentVideoUrl) {
      query = query.eq('video_url', currentVideoUrl);
    }

    const { data, error } = await query;
    if (error) throw error;

    list.innerHTML = '';
    
    data.forEach(function(item) {
      if (!item.comment) return; 

      var statusBadge = item.is_done ? 
        '<span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded border border-green-500/30">完了</span>' : 
        '<span class="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded border border-blue-500/30">確認中</span>';

      var d = document.createElement('div');
      d.className = "bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg relative";
      d.innerHTML = '<div class="flex justify-between items-start mb-3">' +
                      '<div class="text-blue-500 font-mono font-bold text-lg">▶ ' + item.timestamp + '</div>' +
                      statusBadge + 
                    '</div>' +
                    '<div class="text-[10px] text-gray-500 font-bold uppercase mb-2">' + item.client_name + '</div>' +
                    '<p class="text-gray-200 text-sm leading-relaxed">' + item.comment + '</p>';
      list.appendChild(d);
    });
  } catch (e) { 
    console.error("リスト取得エラー:", e);
  }
}