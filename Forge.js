// ========================================
// 鍛冶場
// ========================================
import Obsidian from './Obsidian.js'
import Profile from './Profile.js'

/**
* ★複数ロード系関数では, 共通の形の引数をとります.
* 引数の形)
* [
*   {id: 'ロード先の要素id', component: 'ロードするコンポーネント'},
*   {id: 'ロード先の要素id', component: 'ロードするコンポーネント'},
*   ...
* ]
*
* ★ロード関数では以下を行います.
* 親HTMLのid指定要素の配下に
* 1. コンポーネントHTMLのbody配下を親HTMLセット
* 2. コンポーネントCSSを親HTMLにセット
* 3. コンポーネントJSを親HTMLにセット
*
* ※使用上の注意※
* 1.ロード先idに対して読み込めるのは1つのコンポーネントのみです。
* 常に、指定されたロード先idに、コンポーネントを上書きで追加します。
* js/cssを含むhtmlを、ロード先idに2つ子要素として付け加えたい場合は
* 読み込み先のhtmlに2つid要素を用意し、2つロードしてください。
*
* ロードの詳細手順はload関数を参照.
*/
const Forge = {

  // ========================================
  // ロード処理
  // ========================================
  /**
  * コンポーネントを順次ロードする.
  *
  * @param dict ロード先とコンポーネントの配列
  * @return void
  */
  seriesLoad(dict) {
    if (!dict.length) {
      return;
    }

    this.load(
      dict[0].id,
      dict[0].component,
      () => {
        dict.shift();
        this.seriesLoad(dict);
      });
  },

  /**
  * [アニメーション付き] コンポーネントを順次ロードする.
  * ロード用のアニメーションをオーバーレイする.
  *
  * @param dict ロード先とコンポーネントの配列
  * @return void
  */
  seriesLoadWithAnime(dict) {
    if (!dict.length) {
      this.closeLoadingView();
      return;
    }

    new Promise(resolve => this.openLoadingView(resolve))
    .then(() => {
      this.load(
        dict[0].id,
        dict[0].component,
        () => {
          dict.shift();
          this.seriesLoadWithAnime(dict);
        });
    });
  },

  /**
  * 初回用ロード関数.
  * ベースフレーム化したのち, アニメーション付きで直列ロード.
  * 存在する場合、Cookieに登録したコンポーネントの状態を復元してロード.
  *
  * @param dict ロード先とコンポーネントの配列
  * @return void
  */
  initLoad(dict) {
    // 最初の要素をベースとみなす
    this.baseFrame(dict[0].id);

    // セッションストレージに元のコンポーネントのロード状態が登録されている場合
    // 画面の更新を考慮して
    // セッションストレージの状態通りのロードを復元する.
    let session = window.sessionStorage.getItem('state');
    if (session) {
      dict = JSON.parse(session);
    }
    window.sessionStorage.setItem('state', []);
    this.seriesLoadWithAnime(dict);
  },

  /**
  * 並列ロード.
  *
  * @param dict ロード先とコンポーネントの配列
  * @return void
  */
  parallelLoad(dict) {
    Promise.all(dict.map(v => this.load(v.id, v.component)))
    .then(() => {
      // ここはiframe追加が全部終わった時.
      // iframeのロード完了後ではないので注意
      // TODO ここでなんかしたい
    });
  },

  /**
   * コンポーネントをロードする.
   * iframeとしてコンポーネントを親要素に追加し
   * iframeロード完了後に, iframe配下をロード先要素に追加
   *
   * @param id ロード先の要素id
   * @param component コンポーネント名
   * @param after ロード完了後の処理(未指定の場合何もしない)
   * @return void
   */
  load(id, component, after) {
    // コンポーネントの状態をセッションストレージに登録
    let session = window.sessionStorage.getItem('state');
    let delComp = null; // stateから消えるコンポーネント
    if (session) {
      // 追加(idの重複は上書き)
      // 1 id: index, component: Base
      // (削除) id: contents, component: Home
      // 2 id: contents, component: NextPage
      let current = JSON.parse(session);
      let dup = current.findIndex(v => v.id == id);
      if (dup != -1) {
        // id重複を削除
        delComp = current[dup].component;
        current.splice(dup, 1);
      }
      current.push({id: id, component: component});
      window.sessionStorage.setItem('state', JSON.stringify(current));
    } else {
      // 初回登録
      window.sessionStorage.setItem('state',
        JSON.stringify([{id: id, component: component}]));
    }

    // 読み込み対象のコンポーネントのバージョン登録/取得
    // (以降のスクリプトをバージョニングするため)
    let verLabel = 0;
    let allVers = [];
    try {
      allVers = Obsidian[Profile.storageName][Profile.WorkKey.compoVer];
    } catch(e) {
      // ObsidianにforgeStorageが未登録
      Obsidian.core.generateStorage(Profile.storageName, Profile.WorkKey.compoVer);
    }
    if (allVers == undefined) {
      Obsidian[Profile.storageName][Profile.WorkKey.compoVer] = [];
    }
    // 初期化 or 取得
    allVers = Obsidian[Profile.storageName][Profile.WorkKey.compoVer];
    let currentVersidx = allVers.findIndex(v => v.componentName == component);
    if (currentVersidx == -1) {
      // なければバージョン登録
      allVers.push({componentName: component, version: 1});
      verLabel = 1;
    } else {
      // あればバージョンを更新
      let currentVersion = Number(allVers[currentVersidx].version);
      allVers[currentVersidx].version = currentVersion + 1;
      verLabel = currentVersion + 1;
    }
    Obsidian[Profile.storageName][Profile.WorkKey.compoVer] = allVers;

    // 一時ロードされるiframe用のidを用意(重複しない)
    // TODO ユニークid作成処理は他でもやってるので, Obsidianに入れる
    // 引数: 元の文字列, 戻り値: ユニークid文字列
    let iframeId = this.get(Profile.WorkKey.component(component));
    let unique = iframeId;
    let i = 1;
    while (document.querySelector(`#${unique}`)) {
      i = (i + 1) | 0;
      unique = iframeId + '-' + i;
    }
    iframeId = unique;

    // ソースを用意(JS/CSSはバージョニング)
    const iframeSrc = Profile.getHtmlURL(component);
    let styleHref = `${Profile.getStyleURL(component)}?v-${verLabel}`;
    let scriptSrc = `${Profile.getScriptURL(component)}?v-${verLabel}`;

    // 1. ロード先配下をクリア
    const clear = (v, r) => {
      this.removeChilds(id);
      r(v);
    };
    // 2. iframeロード後, iframe要素をクローンしてロード先に移動
    const setDom = (v, r) => {
      this.addElements(id,
        document.querySelector(`#${iframeId}`)
        .contentWindow.document.body.cloneNode(true).childNodes);
      // 元要素は削除
      document.querySelector(`#${iframeId}`).remove();
      r(v);
    };
    // 3. CSSをセット
    const setCss = (v, r) => {
      // delCompを削除
      document.querySelectorAll('link')
        .forEach(v => {
          if (v.href.indexOf(Profile.getStyleURL(delComp)) != -1) {
            v.remove();
          }
        });
      // 旧ソースを削除
      if (verLabel != 1) {
        // NodeListはfilterが使えないのでforEachを使用
        document.querySelectorAll('link')
          .forEach(v => {
            if (v.href.indexOf(Profile.getStyleURL(component)) != -1) {
              v.remove();
            }
          });
      }
      // 追加
      let el = document.createElement('link');
      el.rel = 'stylesheet';
      el.type = 'text/css';
      el.href = styleHref;
      // TODO 事前にファイルの有無を確認したい → node.js
      // ソースが見つからない場合, ロードしないハンドリングをしたい
      // エラーが出るのは, appendChildが完了してからなので, catch句に入れない
      document.head.appendChild(el);
      r(v);
    };
    // 4. JSをセット
    const setJs = (v, r) => {
      // delCompを削除
      document.querySelectorAll('script')
        .forEach(v => {
          if (v.src.indexOf(Profile.getScriptURL(delComp)) != -1) {
            v.remove();
          }
        });
      // 旧ソースを削除
      if (verLabel != 1) {
        // NodeListはfilterが使えないのでforEachを使用
        document.querySelectorAll('script')
          .forEach(v => {
            if (v.src.indexOf(Profile.getScriptURL(component)) != -1) {
              v.remove();
            }
          });
      }
      // 追加
      let el = document.createElement('script');
      el.type = 'module';
      el.src = scriptSrc;
      document.body.appendChild(el);
      r(v);
    };
    // 5. ロード完了後処理を実行
    const _after = (v, r) => {
      console.debug(`--Load   End: ${component}`);
      if (after) {
        after();
      }
      r(v);
    };

    // iframeロード設定
    const createIframe = (v, r) => {
      let iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.src = iframeSrc;
      iframe.style.display = 'none';
      iframe.onload = () => Obsidian.core.seriesExe([setDom, setCss, setJs, _after]);
      document.body.appendChild(iframe);
      r(v);
    };

    console.debug(`--Load Start: ${component}`);
    Obsidian.core.seriesExe([clear, createIframe]);
  },

  // ========================================
  // DOM操作
  // ========================================
  /**
  * idで指定した要素の配下に, 要素を追加
  *
  * @param id
  * @param elemArray HTMLCollection型
  * @return void
  */
  addElements(id, elemArray) {
    let elem = document.querySelector(`#${id}`);
    let i = 1;
    while (0 < elemArray.length) {
      // HTMLCollection#itemで要素を取得すると
      // 元listから削除されるので, 固定index0
      elem.appendChild(elemArray.item(0));
      // 処理速度改善 型認識させるため|0を追記
      i = (i + 1) | 0;
    }
  },

  /**
  * idで指定した要素の配下を全て削除
  *
  * @param id
  * @return void
  */
  removeChilds(id) {
    let elem = document.querySelector(`#${id}`);
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  },

  // ========================================
  // ユニークid作成/共通ストレージ操作
  // ========================================
  // TODO このへんForgeにあるのがなんか変, 切り分けたい
  /**
  * 共通ストレージから, keyで指定したid文字列を取得
  * なければ生成/セットし, 新idを返却
  *
  * @param key
  * @return id文字列
  */
  get(key) {
    let result;
    try {
      result = Obsidian[Profile.storageName][key];
    } catch (e) {
      // 未登録
    }
    // 未登録
    if (result == undefined) {
      result = this.generate(key);
    }
    return result;
  },

  /**
  * 共通ストレージに, keyと id文字列をセット
  * idは必ずユニークとなる.
  *
  * @param key
  * @return 生成したid
  */
  generate(key) {
    // TODO ユニークid作成のみObsidianに切り出す.
    let unique = key;
    let i = 1;
    while (document.querySelector(`#${unique}`)) {
      i = (i + 1) | 0;
      unique = key + '-' + i;
    }
    try {
      Obsidian[Profile.storageName][key] = unique;
    } catch(e) {
      // ObsidianにforgeStorageが未登録
      Obsidian.core.generateStorage(Profile.storageName, key);
      Obsidian[Profile.storageName][key] = unique;
    }
    return unique;
  },

  /**
  * 共通ストレージから指定したkey項目を削除
  *
  * @param key
  * @return void
  */
  delete(key) {
    delete Obsidian[Profile.storageName][key];
  },

  // ========================================
  // 全体ロード画面
  // ========================================
  /**
  * ロード画像をフェードイン
  */
  openLoadingView(r) {
    // ロード画面用idを生成
    let id = this.get(Profile.WorkKey.loading);
    if (document.querySelector(`#${id}`)) {
      // あるならやらない
      r();
      return;
    }
    let loadObj = document.createElement('div');
    loadObj.id = id;
    // 画面全体に
    loadObj.style.width = '100vw';
    loadObj.style.height = '100vh';
    // かぶせる
    loadObj.style.position = 'fixed';
    loadObj.style.top = '0';
    loadObj.style.left = '0';
    loadObj.style.zIndex = '9999';
    // 画像
    loadObj.style.background = Profile.getLoadImg();
    loadObj.style.backgroundRepeat = 'no-repeat';
    loadObj.style.backgroundPosition = 'center';
    loadObj.style.backgroundColor = 'black';
    loadObj.style.minHeight = '100%';
    loadObj.style.minWidth = '100%';
    // フェードイン用idを生成
    let fadein = this.get(Profile.WorkKey.fadein);
    // フェードイン時間を指定
    let delay = Profile.WorkKey.fadeinDelay;
    let css = document.createElement('style');
    css.id = fadein;
    css.media = 'screen';
    css.type = 'text/css';
    css.appendChild(document.createTextNode(
      `@keyframes ${fadein} {${[
        '0% { opacity: 0 }',
        '100% { opacity: 1 }'
      ].join(' ')}}`
    ));
    document.head.appendChild(css);
    loadObj.style.animation = `${fadein} ${delay}s`;
    document.body.appendChild(loadObj);
    // 最低再生時間だけ遅延する
    // フェードイン+再生 後に不要要素を削除
    setTimeout(() => {
      document.querySelector(`#${fadein}`).remove();
      this.delete(Profile.WorkKey.fadein);
      r();
    }, delay*1000+Profile.WorkKey.loadingDelay*1000);
  },

  /**
  * ロード画像をフェードアウト
  */
  closeLoadingView() {
    // フェードイン用idを生成
    let fadeout = this.get(Profile.WorkKey.fadeout);
    // フェードアウト時間を指定
    let delay = Profile.WorkKey.fadeoutDelay;
    let css = document.createElement('style');
    css.id = fadeout;
    css.media = 'screen';
    css.type = 'text/css';
    css.appendChild(document.createTextNode(
      `@keyframes ${fadeout} {${[
          '0% { opacity: 1 }',
          '100% { opacity: 0 }'
        ].join(' ')}}`
    ));
    document.head.appendChild(css);
    // ロード画面用idを取得
    let id = this.get(Profile.WorkKey.loading);
    document.querySelector(`#${id}`).style.animation = `${fadeout} ${delay}s`;
    // フェードアウト後に削除
    setTimeout(() => {
      document.querySelector(`#${fadeout}`).remove();
      document.querySelector(`#${id}`).remove();
      this.delete(Profile.WorkKey.fadeout);
      this.delete(Profile.WorkKey.loading);
    }, delay*1000);
  },

  // TODO ajax待機時間のアニメを作成したい

  // ========================================
  // フレーム
  // ========================================
  /**
  * フレーム化.
  * index.htmlのベースとなる要素を画面いっぱいに描画.
  *
  * 使用例) 本jsをindex.htmlに読み込んでいる場合
  * index.htmlの<div id="target"></div> を紙芝居の枠とするなら
  * このdivを画面いっぱいに描画
  *
  * @param id フレーム化する要素id これを画面いっぱいに描画する
  */
  baseFrame(id) {
    // bodyを全体表示
    let bodyElem = document.body;
    bodyElem.style.margin = '0';
    bodyElem.style.width = '100%';
    bodyElem.style.height = '100%';

    // 指定id要素を全体表示
    let elem = document.querySelector(`#${id}`);
    elem.style.margin = '0';
    elem.style.width = '100%';
    elem.style.height = '100%';
    console.debug('--BASE INITIALIZED');
  },

};
export default Forge;
