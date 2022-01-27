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
    // ========================================
    // 1. コンポーネントの状態をセッションストレージに登録
    // ========================================

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


    // ========================================
    // 2. 読み込み対象のコンポーネントのバージョン登録/取得
    // ========================================
    // (以降のスクリプトをバージョニングするため)

    const thisKey = Profile.storageName;
    const wk = Profile.WorkKey;

    let verLabel = 0;

    // 初期化 or 取得
    let allVers = Obsidian.core.get(thisKey, wk.compoVer);
    if (!allVers) {
      allVers = [];
    }
    let nowVersidx = allVers.findIndex(v => v.componentName == component);
    if (nowVersidx == -1) {
      // なければバージョン登録
      allVers.push({componentName: component, version: 1});
      verLabel = 1;
    } else {
      // あればバージョンを更新
      let nowVer = Number(allVers[nowVersidx].version);
      allVers[nowVersidx].version = nowVer + 1;
      verLabel = nowVer + 1;
    }
    Obsidian[thisKey][wk.compoVer] = allVers;

    // ========================================
    // 3. ロード準備
    // ========================================

    // 一時ロードされるiframe用のidを用意(重複しない)
    let iframeId = this.uniqueId(wk.component(component));
    Obsidian.core.addKey(thisKey, wk.component(component));
    Obsidian[thisKey][wk.component(component)] = iframeId;

    // ソースを用意(JS/CSSはバージョニング)
    const iframeSrc = Profile.getHtmlURL(component);
    let styleHref = `${Profile.getStyleURL(component)}?v-${verLabel}`;
    let scriptSrc = `${Profile.getScriptURL(component)}?v-${verLabel}`;

    // ========================================
    // 4. ロードの実行順を定義
    // ========================================

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
      // stateから削除する要素を削除
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
      // stateから削除する要素を削除
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

    // ========================================
    // end. ロードの実行順を定義
    // ========================================

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

  /**
  * ユニークid.
  *
  * @param key 作成したいid文字列
  * @return ユニークにしたid文字列
  */
  uniqueId(key) {
    let unique = key;
    let i = 1;
    while (document.querySelector(`#${unique}`)) {
      i = (i + 1) | 0;
      unique = key + '-' + i;
    }
    return unique;
  },

  // ========================================
  // 全体ロード画面
  // ========================================
  /**
  * ロード画像をフェードイン
  */
  openLoadingView(r) {
    const thisKey = Profile.storageName;
    const wk = Profile.WorkKey;

    // 作業用idを取得
    let id = Obsidian.core.get(thisKey, wk.loading);
    // あるならやらない
    if (id) {
      r();
      return;
    }
    // なければ初回ロード
    id = this.uniqueId(wk.loading);
    Obsidian[thisKey][wk.loading] = id;
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
    // フェードイン用idを生成(すぐに削除)
    let fadein = this.uniqueId(wk.fadein);
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
    loadObj.style.animation = `${fadein} ${wk.fadeinDelay}s`;
    document.body.appendChild(loadObj);
    // 最低再生時間だけ遅延する
    // フェードイン+再生 後に不要要素を削除
    setTimeout(() => {
      document.querySelector(`#${fadein}`).remove();
      r();
    }, wk.fadeinDelay*1000 + wk.loadingDelay*1000);
  },

  /**
  * ロード画像をフェードアウト
  */
  closeLoadingView() {
    const wk = Profile.WorkKey;
    // フェードイン用idを生成(すぐに削除)
    let fadeout = this.uniqueId(wk.fadeout);
    // フェードアウト時間を指定
    let delay = wk.fadeoutDelay;
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
    let id = Obsidian.core.get(Profile.storageName, wk.loading);
    document.querySelector(`#${id}`).style.animation = `${fadeout} ${delay}s`;
    // フェードアウト後に削除
    setTimeout(() => {
      document.querySelector(`#${fadeout}`).remove();
      document.querySelector(`#${id}`).remove();
      // フェードイン画像idをObsidianから削除
      delete Obsidian[Profile.storageName][wk.loading];
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
