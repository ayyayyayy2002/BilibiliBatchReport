// ==UserScript==
// @name         BiliBili专栏批量举报
// @namespace    https://github.com/ayyayyayy2002/BilibiliArticleBatchReport
// @version      0.0.1
// @description  DEMO
// @author       Your Name
// @match        https://space.bilibili.com/*/article
// @grant        GM_xmlhttpRequest
// @connect      api.bilibili.com
// @icon         https://i2.hdslb.com/bfs/app/8920e6741fc2808cce5b81bc27abdbda291655d3.png@240w_240h_1c_1s_!web-avatar-space-header.avif
// ==/UserScript==

(function() {
    'use strict';

    let currentPage = 1; // 初始页码
    let pageSize = 30;
    let reportCount = 0
    const urlParams = new URLSearchParams(window.location.search);
    const mid = window.location.pathname.split('/')[1]; // 从地址栏获取 mid
    console.log(mid)


    const floatingWindow = document.createElement('div');
floatingWindow.style.position = 'fixed';
floatingWindow.style.top = '90px';
floatingWindow.style.right = '20px';
floatingWindow.style.zIndex = '9999';
floatingWindow.style.background = 'white';
floatingWindow.style.border = '1px solid #ccc';
floatingWindow.style.padding = '10px';
floatingWindow.style.maxWidth = '250px';
floatingWindow.style.overflow = 'auto'; // Add overflow property for scrolling
floatingWindow.style.height = '200px'; // Set a height for the window
floatingWindow.style.scrollBehavior = 'smooth'; // Enable smooth scrolling
document.body.appendChild(floatingWindow);
// Create diagnostic info container
const diagnosticInfo = document.createElement('div');
floatingWindow.appendChild(diagnosticInfo);
// Function to scroll to the bottom of the floating window
function scrollToBottom() {
  floatingWindow.scrollTop = floatingWindow.scrollHeight;
  // Scroll the last element into view
  const lastElement = floatingWindow.lastElementChild;
  if (lastElement) {
    lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
// Updating the diagnosticInfo.innerHTML with the scroll to bottom
function updateDiagnosticInfo(content) {
  diagnosticInfo.innerHTML += content;
  scrollToBottom();
}



    function processArticleIds(articleIds) {
        let index = 0;

        function processNext() {
            if (index < articleIds.length) {
                const aid = articleIds[index];
                console.log(`Processing article ID: ${aid}`); // 打印当前处理的ID
                sendComplaint(aid); // 调用处理函数

                index++;

                // 每处理一个ID后，设置3500ms的延迟再处理下一个ID
                setTimeout(() => {
                    console.log(`Waiting 3500ms before processing the next ID...`); // 等待提示
                    processNext(); // 继续处理下一个
                }, 3500);
            } else {
                currentPage++;
                getAid(currentPage); // 处理完毕后请求下一页
            }
        }

        processNext(); // 开始处理 ID
    }



    function addButton() {
  // Existing button creation code remains unchanged
  // Add a call to sendReportRequest before calling the existing functionality
  const button = document.createElement('button');
  button.textContent = '自动举报所有专栏';
  button.style.position = 'fixed';
  button.style.top = '60px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.onclick = function() {
    getAid(currentPage);
  };
  document.body.appendChild(button);
}


 function getAid(page) {
    const url = `https://api.bilibili.com/x/space/article?mid=${mid}&pn=${page}&ps=${pageSize}&sort=publish_time`;

    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function(response) {
            if (response.status === 200) {
                const data = JSON.parse(response.responseText);
                console.log("Response Data:", data); // 打印完整的响应数据

                if (data.code === 0 && data.data) {
                    const { count, pn } = data.data;

                    // 如果没有文章，则直接返回
                    if (!data.data.articles || data.data.articles.length === 0) {
                        console.log("No articles found for this account. Exiting...");
                        return; // 退出，不再请求下一页
                    }

                    const totalPages = Math.ceil(count / pageSize); // 计算总页数

                    console.log(`Current Page: ${pn}, Total Pages: ${totalPages}, Total Count: ${count}`); // 调试输出

                    // 检查是否已到达最后一页
                    if (pn >= totalPages) {
                        updateDiagnosticInfo('<strong style="font-size: 2em; color: blue;">全部专栏举报完成</strong><br>');
                        return; // 退出，不再请求下一页
                    }

                    const articles = data.data.articles || [];
                    const articleIds = articles.map(article => article.id);
                    console.log("Article IDs:", articleIds); // 打印所有ID到控制台
                    processArticleIds(articleIds); // 处理所有文章ID
                } else {
                    console.error("Error in response:", data.message);
                }
            } else {
                console.error("Request failed with status:", response.status);
            }
        },
        onerror: function(err) {
            console.error("Request error:", err);
        }
    });
}




    function getCsrf() {
        let csrfText = '';
        const cookieMatch = document.cookie.match(/bili_jct=(.*?);/) ?? [];
        if (cookieMatch.length === 2) {
            csrfText = cookieMatch[1];
        }
        return csrfText;
    }

    // 发送投诉的函数，接受 aid 参数
    function sendComplaint(aid) {
        reportCount++
        const csrfToken = getCsrf();
        const data = new URLSearchParams({
            'aid': aid,  // 使用传入的 aid 值
            'cid': '9',
            'reason': '色情游戏及其他色情内容推广，站外色情内容引流',
            'images': '',
            'csrf': csrfToken
        });

        let xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('POST', 'https://api.bilibili.com/x/article/complaints');

        // 设置请求头
        xhr.setRequestHeader('accept', 'application/json, text/plain, */*');
        xhr.setRequestHeader('accept-language', navigator.language || 'zh-CN,zh;q=0.9');
        xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('cookie', document.cookie);
        xhr.setRequestHeader('origin', 'https://www.bilibili.com');
        xhr.setRequestHeader('referer', window.location.href);
        xhr.setRequestHeader('user-agent', navigator.userAgent);


        // 其他的 sec-* 头可以根据需要添加


        // 对请求的响应进行处理
        xhr.onload = function() {


            updateDiagnosticInfo(`成功举报${reportCount}，文章ID: ${aid} - 响应内容: ${xhr.responseText}<br>`);
        };

        // 发送请求
        xhr.send(data);
    }




        window.addEventListener('load', () => {
        addButton();
        // 页面加载后开始获取文章ID
    });

})();
