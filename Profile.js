// ========================================
// Forge用プロファイル
// ========================================
const Profile = {
  // Obsidianストレージ登録名
  storageName: 'ForgeStorage',
  // コンポーネント名からロードするHTML
  getHtmlURL: component => `./component/${component}/${component}.html`,
  // コンポーネント名からロードするCSS
  getStyleURL: component => `./component/${component}/${component}.css`,
  // コンポーネント名からロードするJSL
  getScriptURL: component => `./component/${component}/${component}.js`,
  // ロード画像
  getLoadImg: () => {
    // 現在の秒のmod5を乱数として選択
    let no = Math.floor(new Date().getSeconds() % 5) + 1;
    return `url("./core/loadimg/load${no}.gif")`; // index.htmlの階層から見る
  },
  // 作業用idの生成key
  WorkKey: {
    // === コンポーネントのバージョン管理===
    // html要素に追加するたび、ブラウザはキャッシュ領域の同名ソースを見る.
    // 同名の場合, 再読込みされないので, URL末尾にバージョン情報を追記する
    // そのバージョンを管理するためのストレージ
    // 形式はdictのリストで, [{componentName: '', version: ''}, ...]
    compoVer: 'componentVersion',

    // === コンポーネント設定===
    component: component => `load-component-${component}`,// ロード用iframeのid

    // === コンポーネントロード中の設定===
    loading: 'loading-id',// 画像id
    loadingDelay: 2,// 最低再生時間
    fadein: 'fade-in-id',// フェードインアニメid
    fadeinDelay: 0.5,// フェードイン時間
    fadeout: 'fade-out-id',// フェードアウトアニメid
    fadeoutDelay: 0.5,// フェードアウト時間
  },
};
export default Profile;
