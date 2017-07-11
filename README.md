# ese

ese(esa search extension)は[esa.io](https://esa.io)の非公式な検索拡張です。

![ss](https://github.com/nalabjp/ese/blob/images/ss.gif)

## Requirement

* UserScriptとして動作するのでTampermonkey(とかGreaseMonkey)が必要です。
* esaのUIを壊しても許せる優しい気持ち

## Installation

* [Tampermonkey](http://tampermonkey.net)をブラウザにインストールする
* ese.user.jsのRAWを開く
    * [latest](https://github.com/nalabjp/ese/raw/v0.7.0/ese.user.js)
    * [master](https://github.com/nalabjp/ese/raw/master/ese.user.js)

## Features

* [検索オプション](https://docs.esa.io/posts/104#2-0-0)の全ての項目をサポート
    * 否定検索は検索文字列の先頭に`-`を付ける
    * 検索文字列の複数指定はスペース区切り
* 検索フォームの保存と復元（1つだけ）
* ショートカット`/`のサポート（オリジナル設定のキーを乗っ取り）
