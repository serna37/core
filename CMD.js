// ========================================
// Windowsコマンド実行機能
// ========================================

// 非同期/同期ストリームでコマンド実行
const { exec, execSync } = require('child_process');

// エンコード
// npm install encoding-japanese --save
const Encoding = require('encoding-japanese');
const enc = v => {
  return Encoding.convert(v, {
    from: 'SJIS',
    to: 'UNICODE',
    type: 'string'
  });
};

const CMD = {
  /**
  * コマンド同期実行関数.
  * @param str 実行コマンドの文字列
  * @return コマンド実行結果
  */
  cmdSync: str => enc(execSync(str)),

  /**
  * コマンド非同期実行関数.
  * @param str 実行コマンドの文字列
  * @param func 実行結果コールバック関数
  * @param eFunc エラー時のコールバック関数
  * @return void
  */
  cmdParallel: (str, func, eFunc) => {
    exec(str, { encoding: 'Shift_JIS' }, (error, stdout, stderror) => {
      return error
        ? eFunc ? eFunc(enc(stderror)) : null
        : func ? func(enc(stdout)) : null;
    });
  },

};
export default CMD;
