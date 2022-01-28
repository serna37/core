// ========================================
// ファイル操作機能
// ========================================
import CMD from './CMD.js'
const fs = require('fs'); // ファイル操作

const Fsys = {
  /**
  * ファイルの存在確認.(同期処理)
  * @param path 確認パス
  * @return 存在すればtrue
  */
  existance(path) {
    try {
      return fs.statSync(path) != null;
    } catch(e) {
      return false;
    }
  },
  /**
  * 配下ファイル数確認.(同期処理)
  * @param path 確認パス
  * @return ファイル数
  */
  count(path) {
    return CMD.cmdSync(`cd /d "${path}" && dir /S /B | find /c /v ""`);
  },
  /**
  * フォルダ名のみ一覧を取得(名前昇順ソート).(同期処理)
  * @param path 検索パス
  * @return フォルダ一覧の名前リスト
  */
  dirList(path) {
    try {
      return CMD.cmdSync(`cd /d "${path}" && dir /ad /b /o:n`)
        .split(/\r\n/).filter(v => v);
    } catch(e) {
      return null;
    }
  },
  /**
  * ファイル名のみ一覧を取得(名前昇順ソート).(同期処理)
  * @param path 検索パス
  * @return ファイル一覧の名前リスト
  */
  fList(path) {
    try {
      return CMD.cmdSync(`cd /d "${path}" && dir /a-d /b /o:n`)
        .split(/\r\n/).filter(v => v);
    } catch(e) {
      return null;
    }
  },
  /**
  * ファイル読み込み.(同期処理)
  * @param path 対象ファイルパス
  * @param cd 文字コード(未指定でUTF-8)
  * @return ファイル内容 エラー時false
  */
  read(path, cd) {
    let charCd = cd ? cd : 'utf8';
    try {
      return fs.readFileSync(path, charCd);
    } catch(e) {
      return false;
    }
  },
  /**
  * ファイル書き込み.(同期処理)
  * @param path 対象ファイルパス
  * @param text 書き込み内容
  * @param mode 未指定/上書きの場合false, 追記の場合true
  * @param cd 文字コード(未指定でUTF-8)
  * @return 成功時true エラー時false
  */
  write(path, text, mode, cd) {
    let charCd = cd ? cd : 'utf8';
    try {
      if (!mode) {
        fs.writeFileSync(path, text, charCd);
      } else {
        fs.appendFileSync(path, text, charCd);
      }
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * フォルダ作成.(同期処理)
  * @param path 対象パス
  * @return 成功時true エラー時false
  */
  mkdir(path) {
    try {
      fs.mkdirSync(path);
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * ファイルコピー(同期処理)
  * @param from 元
  * @param to コピー先
  * @return 成功時true エラー時false
  */
  copy(from, to) {
    try {
      fs.copyFileSync(from, to);
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * ファイルコピー(非同期処理)
  * @param from 元
  * @param to コピー先
  * @return 成功時true エラー時false
  */
  copyParallel(from, to) {
    try {
      fs.copyFile(from, to);
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * フォルダコピー(非同期処理)
  * @param from 元
  * @param to コピー先
  * @return 成功時true エラー時false
  */
  robocopy(from, to) {
    try {
      CMD.cmdParallel(`robocopy /e "${from}" "${to}"`);
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * フォルダコピー(非同期処理)
  * @param from 元
  * @param to コピー先
  * @return 成功時true エラー時false
  */
  cpSync(from, to) {
    try {
      CMD.cmdSync(`copy /y "${from}" "${to}"`);
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * 削除(同期処理)
  * @param path 対象パス
  * @return 成功時true エラー時false
  */
  delete(path) {
    try {
      fs.unlinkSync(path);
      return true;
    } catch(e) {
      return false;
    }
  },
  /**
  * 削除(同期処理)
  * @param path 対象パス
  * @return void
  */
  delCmd(path) {
    CMD.cmdSync(`rmdir /s /q ${path}`);
  },
  /**
  * 圧縮(同期処理)
  * @param path 対象パス
  * @return void
  */
  compress(path) {
    CMD.cmdSync(`powershell Compress-Archive -Path ${path} -DestinationPath ${path}.zip -Force`);
  },
};
export default Fsys;
