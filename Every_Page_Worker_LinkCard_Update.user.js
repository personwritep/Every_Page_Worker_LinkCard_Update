// ==UserScript==
// @name        Every Page Worker 💢💢 LinkCard Update
// @namespace        http://tampermonkey.net/
// @version        5.1
// @description        「記事の編集・削除」でブログ全記事を開いて更新を実行
// @author        Ameba Blog User
// @match        https://blog.ameba.jp/ucs/entry/srventrylist*
// @match        https://blog.ameba.jp/ucs/entry/srventryupdate*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameba.jp
// @run-at        document-start
// @grant        none
// @updateURL        https://github.com/personwritep/Every_Page_Worker_LinkCard_Update/raw/main/Every_Page_Worker_LinkCard_Update.user.js
// @downloadURL        https://github.com/personwritep/Every_Page_Worker_LinkCard_Update/raw/main/Every_Page_Worker_LinkCard_Update.user.js
// ==/UserScript==



window.addEventListener('DOMContentLoaded', function(){ // CSSデザインを適用する
    let body_id=document.body.getAttribute('id');
    if(body_id=='entryListEdit'){ //「記事の編集・削除」の画面にのみCSS適用

        let style=
            '<style>'+
            '#globalHeader, #ucsHeader, #ucsMainLeft h1, .l-ucs-sidemenu-area, .selection-bar { '+
            'display: none !important; } '+

            '#ucsContent { width: 930px !important; } '+
            '#ucsContent::before { display: none; } '+
            '#ucsMainLeft { width: 930px !important; padding: 0 15px !important; } '+

            '#entrySort { margin-bottom: 2px; } '+
            '#nowMonth { color: #000; } '+
            '#entryListEdit form { display: flex; flex-direction: column; } '+
            '#entrySort { order: -2; } '+
            '.pagingArea { order: -1; margin-bottom: -33px; position:unset !important; } '+
            '.pagingArea a { border: 1px solid #888; } '+
            '.pagingArea .active{ border: 2px solid #0066cc; } '+
            '.pagingArea a, .pagingArea .active, .pagingArea .disabled { font-size: 14px; line-height: 23px; } '+
            '#sorting { margin: 36px 0 4px; padding: 2px 0; height: 78px; background: #ddedf3; } '+
            '#sorting select, #sorting ul { display: none; } '+

            '#entryList .status-text { right: 374px !important; } '+
            '#entryList .entry-info .date { right: 260px !important; } '+
            '#entryList .actions { width: 240px; } '+

            '#div0 { color: #333; font-size: 14px; margin: 0 -10px 0 15px; } '+
            '#div1 { color: #000; font-size: 14px; margin: 1px 15px; background: #c0dbed; } '+
            '#list_snap { padding: 2px 0 0; margin: 7px 20px 7px 0; width: 180px; } '+
            '#reset { padding: 2px 0 0; margin-right: 20px; width: 60px; } '+
            '#export { padding: 2px 0 0; margin: 7px 10px 7px 0; width: 100px; } '+
            '.snap_result { display: inline-block; margin: 6px 4px 4px 12px; } '+
            '.num { padding: 2px 2px 0 6px; width: 40px; } '+
            '.editor_open { padding: 2px 0 0; margin: 0 20px 0 4px; width: 50px; } '+
            'input { font-family: meiryo; font-size: 14px; } '+
            '.ch1, .ch2 { font: 15px/27px Meiryo; color: #0277bd; opacity: 0; }'+
            '.ch1 { margin-left: 8px; } '+
            '.ch2 { margin-left: 2px; } '+
            '</style>';

        document.head.insertAdjacentHTML('beforeend', style);

        let actions=document.querySelectorAll('#entryList .actions');
        for(let k=0; k<actions.length; k++){
            let iAH='<span class="ch1">❶</span><span class="ch2">❷</span>';
            actions[k].insertAdjacentHTML('beforeend', iAH); }

    }})



window.addEventListener('load', function(){ // 親ウインドウで働くメインスクリプト
    let body_id=document.body.getAttribute('id');
    if(body_id=='entryListEdit'){ // 親ウインドウの条件

        let drive_mode; // ページ更新時の動作モード
        let blogDB={}; //「対象記事のID/チェックフラグ または内容」の記録配列

        let entry_id_DB; // ID検索用の配列
        let pub_1; // flag 1 が記録された記事総数
        let pub_2; // flag 2 が記録された記事総数

        let entry_id;
        let entry_target;
        let list_bar;
        let editor_flg;

        let next_target; // ページ内の次の対象記事
        let new_win;
        let link_target;
        let editor_iframe;
        let iframe_doc;

        let ua=0;
        let agent=window.navigator.userAgent.toLowerCase();
        if(agent.indexOf('firefox') > -1){ ua=1; } // Firefoxの場合のフラグ


        let read_json=localStorage.getItem('EPW_DB_back'); // ローカルストレージ 保存名
        blogDB=JSON.parse(read_json);
        if(blogDB==null){
            blogDB=[['epw00000000', 's', 0]]; }
        drive_mode=blogDB[0][1]; // 起動時に動作フラグを取得
        blogDB[0][1]='s'; // リロード時等のためにリセット
        let write_json=JSON.stringify(blogDB);
        localStorage.setItem('EPW_DB_back', write_json); // ローカルストレージ 保存

        reg_set();

        function reg_set(){
            let k;
            entry_id_DB=[]; // リセット
            pub_1=0;
            pub_2=0;

            for(k=0; k<blogDB.length; k++){
                entry_id_DB[k]=blogDB[k][0]; // ID検索用の配列を作成
                if(blogDB[k][1]=='1'){
                    pub_1 +=1; } // flag 1 が記録された記事総数（検索1）
                if(blogDB[k][2]=='1'){
                    pub_2 +=1; }}} // flag 2 が記録された記事総数（検索2）


        entry_id=document.querySelectorAll('input[name="entry_id"]');
        entry_target=document.querySelectorAll('.entry-item .entry');
        list_bar=document.querySelectorAll('#entryList .entry-item');


        control_pannel(drive_mode);

        hit_display();

        function control_pannel(dm){
            let sty;
            let insert_div0;
            insert_div0=document.createElement('div');
            insert_div0.setAttribute('id', 'div0');
            let box=document.querySelector('#sorting');
            box.appendChild(insert_div0);

            let insert_div1;
            insert_div1=document.createElement('div');
            insert_div1.setAttribute('id', 'div1');
            box.appendChild(insert_div1);

            let button1=document.createElement('input');
            button1.setAttribute('id', 'list_snap');
            button1.setAttribute('type', 'submit');
            insert_div0.appendChild(button1);
            if(dm=='s'){
                button1.setAttribute('value', '全記事へ処理を開始　▶'); }
            else if(dm=='c'){
                button1.setAttribute('value', '　処理を一旦停止　　❚❚'); }
            else if(dm=='e'){
                button1.setAttribute('value', '処理が全て終了しました'); }

            button1.addEventListener('click', function(e){
                e.preventDefault();
                if(e.ctrlKey){
                    start_stop(1); } // ページの途中から連続処理スタート
                else{
                    start_stop(0); }}, false);


            function start_stop(n){
                if(drive_mode=='s'){ // 最初の起動直後
                    let conf_str='　　 🔴　このページ以降の記事に連続した処理を実行します'+
                        '\n\n　　　　  停止ボタンのクリックで処理停止/処理再開ができます';
                    let ok=confirm(conf_str);
                    if(ok){
                        drive_mode='c'; // ページ内の連続処理
                        button1.setAttribute('value', '　処理を一旦停止　　❚❚');
                        if(n==0){
                            next(0); }
                        else{
                            alert('　処理を開始する記事を左クリックしてください');
                            clicked_item(); }}}

                else if(drive_mode=='c'){ // 連続動作状態の場合
                    drive_mode='p'; // クリックされたら「p」停止モード
                    button1.setAttribute('value', '　処理を再開する　　▶'); }

                else if(drive_mode=='p'){ // 動作停止状態の場合
                    drive_mode='c'; // クリックされたら連続動作を再開
                    button1.setAttribute('value', '　処理を一旦停止　　❚❚');
                    open_win(next_target); }

                function clicked_item(){
                    let entry_item=document.querySelectorAll('.entry-item');
                    for(let k=0; k<entry_item.length; k++){
                        entry_item[k].onclick=function(e){
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            next(k); }}}
            } // start_stop()


            if(dm=='c'){ // ページを開いた時に「c」は連続動作
                setTimeout(next(0), 200); } // 「c」連続動作はぺージ遷移時 0.2sec で自動実行 ⭕
            else if(dm=='e'){ // 「e」は終了
                button1.style.pointerEvents='none'; }


            let button2=document.createElement('input');
            button2.setAttribute('id', 'reset');
            button2.setAttribute('type', 'submit');
            button2.setAttribute('value', '初期化');
            insert_div0.appendChild(button2);

            button2.onclick=function(e){
                e.preventDefault();
                blogDB=[['epw00000000', 's', 0]];
                let write_json=JSON.stringify(blogDB);
                localStorage.setItem('EPW_DB_back', write_json); // ローカルストレージ保存
                snap_disp();
                hit_display_clear();
                document.querySelector('#reset').value='〔　〕'; }

            let button3=document.createElement('input');
            button3.setAttribute('id', 'export');
            button3.setAttribute('type', 'submit');
            button3.setAttribute('value', 'ファイル保存');
            insert_div0.appendChild(button3);

            button3.onclick=function(e){
                e.preventDefault();
                let write_json=JSON.stringify(blogDB);
                let blob=new Blob([write_json], {type: 'application/json'});
                let a_elem=document.createElement('a');
                a_elem.href=URL.createObjectURL(blob);
                a_elem.download='EPW.json'; // 保存ファイル名
                if(ua==1){
                    a_elem.target='_blank';
                    document.body.appendChild(a_elem); }
                a_elem.click();
                if(ua==1){
                    document.body.removeChild(a_elem); }
                URL.revokeObjectURL(a_elem.href); }

            let button4=document.createElement('input');
            button4.setAttribute('type', 'file');
            button4.setAttribute('style', 'vertical-align: 1px; width: 390px');
            insert_div0.appendChild(button4);

            button4.addEventListener("change", function(){
                if(!(button4.value)) return; // ファイルが選択されない場合
                let file_list=button4.files;
                if(!file_list) return; // ファイルリストが選択されない場合
                let file=file_list[0];
                if(!file) return; // ファイルが無い場合

                let file_reader=new FileReader();
                file_reader.readAsText(file);
                file_reader.onload=function(){
                    if(file_reader.result.slice(0, 15)=='[["epw00000000"'){ // EPW.jsonの確認
                        let data_in=JSON.parse(file_reader.result);
                        blogDB=data_in; // 読込み上書き処理
                        let write_json=JSON.stringify(blogDB);
                        localStorage.setItem('EPW_DB_back', write_json); // ローカルストレージ 保存
                        button2.setAttribute('value', '初期化'); // 初期化後なら読み込んだ事を示す
                        snap_disp(); }
                    else{
                        alert("   ⛔ 不適合なファイルです  EPW.json ファイルを選択してください");}};});

            let span5=document.createElement('span');
            span5.setAttribute('id', 'snap_result1');
            span5.setAttribute('class', 'snap_result');
            insert_div1.appendChild(span5);

            let button6=document.createElement('input');
            button6.setAttribute('id', 'num_1');
            button6.setAttribute('class', 'num');
            button6.setAttribute('type', 'number');
            button6.setAttribute('min', '0');
            insert_div1.appendChild(button6);

            let button7=document.createElement('input');
            button7.setAttribute('class', 'editor_open');
            button7.setAttribute('type', 'submit');
            button7.setAttribute('value', '編集');
            insert_div1.appendChild(button7);

            button7.onclick=function(e){
                e.preventDefault();
                let k;
                let pub_1_DB=[]; // pub_1 の entry_id の配列
                if(pub_1>0){
                    for(k=0; k<blogDB.length; k++){
                        if(blogDB[k][1]=='1'){
                            pub_1_DB.push(blogDB[k][0]); }}

                    if(button6.value>0){
                        let open_id=pub_1_DB[button6.value -1];
                        let pass=
                            'https://blog.ameba.jp/ucs/entry/srventryupdateinput.do?id='+ open_id;
                        let win_option='top=20, left=40, width=1020, height=900';
                        window.open(pass, button6.value, win_option); }}}

            let span8=document.createElement('span');
            span8.setAttribute('id', 'snap_result2');
            span8.setAttribute('class', 'snap_result');
            insert_div1.appendChild(span8);

            let button9=document.createElement('input');
            button9.setAttribute('id', 'num_2');
            button9.setAttribute('class', 'num');
            button9.setAttribute('type', 'number');
            button9.setAttribute('min', '0');
            insert_div1.appendChild(button9);

            let button10=document.createElement('input');
            button10.setAttribute('class', 'editor_open');
            button10.setAttribute('type', 'submit');
            button10.setAttribute('value', '編集');
            insert_div1.appendChild(button10);

            button10.onclick=function(e){
                e.preventDefault();
                let k;
                let pub_2_DB=[]; // pub_2 の entry_id の配列
                if(pub_2>0){
                    for(k=0; k<blogDB.length; k++){
                        if(blogDB[k][2]=='1'){
                            pub_2_DB.push(blogDB[k][0]); }}

                    if(button9.value>0){
                        let open_id=pub_2_DB[button9.value -1];
                        let pass=
                            'https://blog.ameba.jp/ucs/entry/srventryupdateinput.do?id='+ open_id;
                        let win_option='top=20, left=40, width=1020, height=900';
                        window.open(pass, button9.value, win_option); }}}

            snap_disp();

        } // control_pannel()


        function snap_disp(){
            reg_set();
            let span5=document.querySelector('#snap_result1');
            span5.textContent='記録件数：' + (blogDB.length -1) + '　　　Check ❶：';
            let button6=document.querySelector('#num_1');
            button6.value=pub_1;
            button6.max=pub_1;
            let span8=document.querySelector('#snap_result2');
            span8.textContent='Check ❷：';
            let button9=document.querySelector('#num_2');
            button9.value=pub_2;
            button9.max=pub_2; }


        function hit_display(){
            let ch1=document.querySelectorAll('.ch1');
            let ch2=document.querySelectorAll('.ch2');
            for(let k=0; k<ch1.length; k++){
                let index=entry_id_DB.indexOf(entry_id[k].value);
                if(index!=-1){ // IDがblogDBに記録されていた場合
                    if(blogDB[index][1]==1){
                        ch1[k].style.opacity='1'; }
                    else{
                        ch1[k].style.opacity='0'; }
                    if(blogDB[index][2]==1){
                        ch2[k].style.opacity='1'; }
                    else{
                        ch2[k].style.opacity='0'; }}}}


        function hit_display_clear(){
            let ch1=document.querySelectorAll('.ch1');
            let ch2=document.querySelectorAll('.ch2');
            for(let k=0; k<ch1.length; k++){
                ch1[k].style.opacity='0';
                ch2[k].style.opacity='0'; }}


        function next(x){ // xはページ内の記事index[0～length-1]
            entry_id=document.querySelectorAll('input[name="entry_id"]');
            if(entry_id.length >x){
                open_win(x); } // 投稿記事がある場合 open_win を開始
            else{
                next_call();}} // 投稿記事が無ければ 次ページをcall する


        function open_win(k){
            next_target=k; // 送信完了までは未処理とする

            new_win=Array(entry_target.length);
            link_target=Array(entry_target.length);
            link_target[k]='/ucs/entry/srventryupdateinput.do?id='+ entry_id[k].value;

            if(drive_mode=='c'){
                let win_option='top=20, left=40, width=800, height=300';
                new_win[k]=window.open(link_target[k], k, win_option);

                list_bar[k].style.boxShadow='inset 0 0 0 2px #03a9f4'; // リスト欄に青枠表示
                new_win[k].addEventListener('load', work, false); } // 子ウインドウの処理 🟦


            function work(){
                let editor_flg=new_win[k].document.querySelector('input[name="editor_flg"]');
                if(editor_flg.value=="5"){ // 最新版エディタの文書の場合のみ処理

                    let interval=setInterval(find_iframe, 100); // iframe 読込み待機コード ⬛ Speed調節 ⬛
                    function find_iframe(){
                        let editor_iframe=new_win[k].document.querySelector('.cke_wysiwyg_frame');
                        if(editor_iframe){
                            let iframe_doc=editor_iframe.contentWindow.document;
                            if(iframe_doc){
                                clearInterval(interval);
                                task();

                                function task(){ // taskは自動で開いたページでの作業コード / 作業目的で自製 🟥

                                    let promise=new Promise((resolve, reject)=>{
                                        let svg_img=iframe_doc.querySelector('svg');
                                        if(svg_img){ // 編集非対応 🟥🟧🟥
                                            reject(); }
                                        else{ // 編集 リンクカードの更新 🟥🟧🟥
                                            let title=iframe_doc.querySelectorAll('.ogpCard_title');
                                            for(let k=0; k<title.length; k++){
                                                let t_style=title[k].getAttribute('style');
                                                if(t_style.includes('clamp: 2') || t_style.includes('clamp:2')){
                                                    title[k].style.maxHeight='44px';
                                                    title[k].style.lineHeight='1.25'; }
                                                else if(t_style.includes('clamp: 1') || t_style.includes('clamp:1')){
                                                    title[k].style.maxHeight='22px'; }}

                                            resolve(); }

                                    })
                                    .then(()=>{ // 処理省略 🟥🟧🟥
                                        let not=0;
                                        return not;

                                    })
                                    .catch(()=>{
                                        return 1;

                                    })
                                    .then((not)=>{

                                        if(not==0){ // 処理成功 🟥🟧🟥
                                            send_result(0); // 処理結果をデータ保存
                                            publish_do(k); } // 編集結果を投稿
                                        else{ // 編集不成功の場合 🟥🟧🟥
                                            send_result(1); } // 処理結果をデータ保存

                                        strage_write();
                                        snap_disp();
                                        hit_display();
                                        end_target(); // 再編集のウインドウを閉じる
                                    });

                                } // task()



                                function send_result(n){
                                    let index=entry_id_DB.indexOf(entry_id[k].value);
                                    if(index==-1){ // IDがblogDBに記録されていない場合
                                        if(n==1){
                                            blogDB.push([entry_id[k].value, 1, 0]); }} // 記事ID/フラグを追加
                                    else{ // IDがblogDBに記録されていた場合
                                        if(n==1){
                                            blogDB[index][1]=1; } // 記事ID/フラグ「1」を更新
                                        else{
                                            blogDB[index][1]=0; }} // 記事ID/フラグ「0」を更新
                                    reg_set(); }


                                function strage_write(){
                                    let write_json=JSON.stringify(blogDB);
                                    localStorage.setItem('EPW_DB_back', write_json); }// ストレージ保存


                                function publish_do(k){
                                    let publish_flg=new_win[k].document.querySelector('input[name="publish_flg"]');
                                    let val=publish_flg.getAttribute('value');

                                    let publish_b0=new_win[k].document.querySelector('button.js-submitButton[publishflg="0"]');
                                    let publish_b1=new_win[k].document.querySelector('button.js-submitButton[publishflg="1"]');
                                    if(val=='0'){ publish_b0.click(); }
                                    if(val=='1'){ publish_b1.click(); }
                                    if(val=='2'){ publish_b0.click(); }}

                            }}}

                } // if(editor_flg.value=="5") // 最新版エディタの文書の場合のみ処理

                else{ // タグ編集エディタの場合
                    let index=entry_id_DB.indexOf(entry_id[k].value);
                    if(index==-1){ // IDがblogDBに記録されていない場合
                        blogDB.push([entry_id[k].value, 1, 0]); } // 記事ID/フラグを追加
                    else{ // IDがblogDBに記録されていた場合
                        blogDB[index][1]=1; } // 記事ID/フラグ「1」を更新
                    reg_set();

                    end_target(); }

            } // work()


            function end_target(){ // 終了処理
                let editor_flg=new_win[k].document.querySelector('input[name="editor_flg"]');
                list_bar[k].style.boxShadow='none';
                if(editor_flg.value=='5'){
                    list_bar[k].style.background='#caedf2'; }
                else{
                    list_bar[k].style.background='#eceff1'; }

                new_win[k].close();
                setTimeout(()=>{
                    next_do(k); }, 10); //⏩

                function next_do(k){
                    next_target=k+1;
                    if(next_target<entry_target.length){ open_win(next_target); }
                    else{ next_call(); }}} // ページの終りまで終了した状態

        } // open_win()


        function next_call(){
            let win_url;
            let current;
            let pageid;
            let next_url;
            let pager;
            let end;

            blogDB[0][1]='c'; // 連続動作フラグを連続にセット
            let write_json=JSON.stringify(blogDB);
            localStorage.setItem('EPW_DB_back', write_json); // ローカルストレージ保存

            win_url=window.location.search.substring(1,window.location.search.length);
            current=win_url.slice(-6);

            if(win_url.indexOf('pageID') ==-1){ // pageIDが無い 月のトップページの場合
                pager=document.querySelector('.pagingArea');
                if(pager){ // ページャーが有りその末尾でなければ同月次ページへ
                    next_url=
                        'https://blog.ameba.jp/ucs/entry/srventrylist.do?pageID=2&entry_ym=' + current;
                    window.open( next_url, '_self'); }
                else{ // ページャーが無ければ次月トップページへ
                    current=make_next(current);
                    if(current!=0){ // 現在を越えないなら次月へ
                        next_url=
                            'https://blog.ameba.jp/ucs/entry/srventrylist.do?entry_ym=' + current;
                        window.open( next_url, '_self'); }
                    else{ // 現在を越えたら0が戻り停止
                        when_edge(); }}}

            else{ // pageIDを含み 月のトップページでない場合
                end=document.querySelector('.pagingArea .disabled.next');
                if(!end){ // ページャーの末尾でなければ同月次ページへ
                    pageid=parseInt(win_url.slice(7).slice(0, -16), 10) +1;
                    next_url=
                        'https://blog.ameba.jp/ucs/entry/srventrylist.do?pageID='+ pageid + '&entry_ym=' + current;
                    window.open( next_url, '_self'); }
                else{ // ページャーの末尾なら次月トップページへ
                    current=make_next(current);
                    if(current!=0){ // 現在を越えないなら次月へ
                        next_url=
                            'https://blog.ameba.jp/ucs/entry/srventrylist.do?entry_ym=' + current;
                        window.open( next_url, '_self'); }
                    else{ // 現在を越えたら0が戻り停止
                        when_edge(); }}}

            function make_next(curr){
                let ym;
                let y;
                let m;
                ym=parseInt(curr, 10); // 10進数値化
                y=Math.floor(ym/100); // 年は100で割った商
                m=ym % 100; // 月は100で割った余り
                if(m !=12){
                    ym=100*y + m +1; }
                else{
                    ym=100*y + 101; }

                let now=new Date();
                if(ym > 100*now.getFullYear() + now.getMonth() +1){
                    return 0; } // 現在の月を越える場合は0を返す
                else{
                    return ym; }} // 次年月の数値を返す

            function when_edge(){
                blogDB[0][1]='s'; // 連続動作フラグをリセット
                let write_json=JSON.stringify(blogDB);
                localStorage.setItem('EPW_DB_back', write_json); // ローカルストレージ保存
                document.querySelector('#div0').remove();
                document.querySelector('#div1').remove();
                control_pannel('e'); } // 全作業の終了時の表示をさせる
        } // next_call()


        // 編集済みの記事にマークを付ける
        let ed_sw=document.querySelectorAll('.actions .action:first-child');
        for(let k=0; k<ed_sw.length; k++){
            ed_sw[k].onmousedown=()=>{
                ed_sw[k].style.boxShadow='inset #2196f3 -16px 0 0 -10px'; }}

        let ed_link=document.querySelectorAll('.actions a');
        for(let k=0; k<ed_link.length; k++){
            ed_link[k].setAttribute('target', '_blank'); }

    } // 親ウインドウの条件




    if(body_id=='entryCreate'){ // 投稿後の終了画面
        let err=document.querySelector('.p-error');
        if(!err){
            window.close();
        }}
});
