// ▼▼▼ あなたのSupabase情報を入れてください ▼▼▼
var SUPABASE_URL = 'https://dwzwrqfeabcdxbsqqmhh.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_er0huDuAK294yBJKswQlMg_Gq1zmjbR';
// ▲▲▲ ▲▲▲ ▲▲▲

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentPlayer = null;
let currentPlatform = '';
let feedbackCart = []; 
let currentProjectData = null; 

window.addEventListener('load', async function() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id'); 
  
  if (projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (data) {
      currentProjectData = data; 
      document.getElementById('videoUrl').value = data.video_url;
      document.getElementById('clientName').value = data.client_name;
      const adminArea = document.getElementById('adminArea');
      if (adminArea) adminArea.style.display = 'none'; 
      loadVideo();
    }
  }
  renderCart();
});

async function loadAndGen() {
  const url = document.getElementById('videoUrl').value;
  const client = document.getElementById('clientName').value;
  const email = document.getElementById('editorEmail').value;
  
  if (!url || !client || !email) return alert('URL、案件名、メールをすべて入力してください');
  document.getElementById('genBtn').innerText = "作成中...";

  const { data, error } = await supabase
    .from('projects')
    .insert([{ video_url: url, client_name: client, editor_email: email }])
    .select();

  document.getElementById('genBtn').innerText = "短縮URLを発行する";
  if (error) return alert('エラーが発生しました：' + error.message);

  const newId = data[0].id;
  const baseUrl = window.location.href.split('?')[0];
  const shortUrl = baseUrl + '?id=' + newId; 
  
  document.getElementById('shareUrl').value = shortUrl;
  document.getElementById('shareArea').classList.remove('hidden');
  currentProjectData = data[0];
  loadVideo();
}

function copyShareUrl() {
  const copyTarget = document.getElementById('shareUrl');
  copyTarget.select();
  document.execCommand("Copy");
  alert("コピー完了！クライアントに送ってください。");
}

function loadVideo() {
  const url = document.getElementById('videoUrl').value;
  const container = document.getElementById('player-container');
  container.innerHTML = ''; 
  if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) {
    currentPlatform = 'youtube';
    const videoId = url.indexOf('v=') !== -1 ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
    container.innerHTML = '<div id="yt-player"></div>';
    currentPlayer = new YT.Player('yt-player', { videoId: videoId, width: '100%', height: '100%' });
  } else if (url.indexOf('vimeo.com') !== -1) {
    currentPlatform = 'vimeo';
    const vimeoId = url.match(/\d+/)[0]; 
    container.innerHTML = '<div id="vimeo-player" style="width:100%;height:100%"></div>';
    currentPlayer = new Vimeo.Player('vimeo-player', { id: vimeoId, width: '100%', height: '100%' });
  }
}

async function captureTime() {
  if (!currentPlayer) return alert('動画を読み込んでください');
  let seconds = (currentPlatform === 'youtube') ? currentPlayer.getCurrentTime() : await currentPlayer.getCurrentTime();
  let min = Math.floor(seconds / 60).toString().padStart(2, '0');
  let sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  document.getElementById('timestamp').value = min + ":" + sec;
}

function addToCart() {
  const time = document.getElementById('timestamp').value;
  const msg = document.getElementById('comment').value;
  if (!time || !msg) return alert('時間とコメントを入力してください');
  feedbackCart.push({ time: time, comment: msg });
  document.getElementById('comment').value = ''; 
  renderCart(); 
}

function deleteItem(index) {
  if(confirm('削除しますか？')) {
    feedbackCart.splice(index, 1);
    renderCart(); 
  }
}

function renderCart() {
  const list = document.getElementById('feedbackList');
  const count = document.getElementById('cartCount');
  const sendArea = document.getElementById('sendAllArea');
  list.innerHTML = '';
  count.innerText = feedbackCart.length + '件';
  if (feedbackCart.length === 0) {
    sendArea.classList.add('hidden');
    list.innerHTML = '<p class="text-gray-600 text-sm col-span-full text-center py-8">指示はありません</p>';
    return;
  }
  sendArea.classList.remove('hidden');
  feedbackCart.forEach(function(item, index) {
    const d = document.createElement('div');
    d.className = "bg-gray-800 p-5 rounded-2xl relative border border-gray-700 shadow";
    d.innerHTML = '<div class="flex justify-between items-start mb-2">' +
                    '<div class="text-blue-500 font-mono font-bold text-lg">' + item.time + '</div>' +
                    '<button onclick="deleteItem(' + index + ')" class="text-gray-500 hover:text-red-500 text-xs">削除 🗑️</button>' +
                  '</div>' +
                  '<p class="text-gray-200 text-sm">' + item.comment + '</p>';
    list.appendChild(d);
  });
}

function sendAllFeedback() {
  if (feedbackCart.length === 0) return;
  if (!currentProjectData || !currentProjectData.editor_email) return alert('送信先不明');

  let bodyText = currentProjectData.client_name + " 様からの修正指示です。\n\n";
  feedbackCart.forEach(item => { bodyText += `【${item.time}】 ${item.comment}\n`; });
  
  const subject = encodeURIComponent(`【動画修正指示】${currentProjectData.client_name}様`);
  const body = encodeURIComponent(bodyText);
  window.location.href = `mailto:${currentProjectData.editor_email}?subject=${subject}&body=${body}`;

  setTimeout(() => {
    if(confirm('メールを起動しました。リストを空にしますか？')) {
      feedbackCart = [];
      renderCart();
    }
  }, 1000);
}