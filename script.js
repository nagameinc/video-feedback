var SUPABASE_URL = 'https://dwzwrqfeabcdxbsqqmhh.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_er0huDuAK294yBJKswQlMg_Gq1zmjbR';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var currentPlayer = null;
var currentPlatform = '';
var currentProjectId = null; // 今回追加：ロッカーの番号を覚える変数

window.addEventListener('load', async function() {
  var params = new URLSearchParams(window.location.search);
  var projectId = params.get('id'); // URLから「?id=1」を探す
  
  if (projectId) {
    // 【クライアント側】ロッカー（projects表）から動画情報を取ってくる
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (data) {
      document.getElementById('videoUrl').value = data.video_url;
      document.getElementById('clientName').value = data.client_name;
      currentProjectId = projectId;
      
      var adminArea = document.getElementById('adminArea');
      if (adminArea) adminArea.style.display = 'none';
      
      loadVideo();
      fetchList();
    }
  }
});

// 管理用：ロッカーに荷物を預けて、短い番号（ID）をもらう
async function loadAndGen() {
  var url = document.getElementById('videoUrl').value;
  var client = document.getElementById('clientName').value;
  if (!url || !client) return alert('動画URLとクライアント名の両方を入れてください');

  // Supabaseの projects 表に保存して、新しいIDを発行してもらう
  const { data, error } = await supabase
    .from('projects')
    .insert([{ video_url: url, client_name: client }])
    .select();

  if (error) return alert('エラーが発生しました');

  var newId = data[0].id; // 発行されたロッカー番号
  var baseUrl = window.location.href.split('?')[0];
  var shortUrl = baseUrl + '?id=' + newId; // 究極に短いURLの完成！
  
  document.getElementById('shareUrl').value = shortUrl;
  document.getElementById('shareArea').classList.remove('hidden');
  
  loadVideo();
  fetchList();
}

// 以下、他の関数（captureTime, submitFeedback, fetchListなど）は
// 前回のコードと全く同じで大丈夫です！
// (スペースの都合で省略しますが、お手元のファイルの下半分は残しておいてください)