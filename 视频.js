// ==UserScript==
// @name         BiliBili视频批量举报
// @namespace    https://github.com/ayyayyayy2002/BilibiliVideoBatchReport
// @version      0.1.7
// @description  BiliBili屎太多，黑名单不够用了，我很痛苦，于是写了这个脚本尝试将痛苦转移到发布视频的人身上，我准备了三个举报理由，点击按钮即可切换
// @author       You
// @match        https://space.bilibili.com/*
// @match        https://www.bilibili.com/appeal/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @exclude      https://space.bilibili.com/*/dynamic
// @exclude      https://space.bilibili.com/*/article
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @connect      api.bilibili.com
// @connect      www.bilibili.com
// @run-at       document-end
// @icon         https://i2.hdslb.com/bfs/app/8920e6741fc2808cce5b81bc27abdbda291655d3.png@240w_240h_1c_1s_!web-avatar-space-header.avif
// @downloadURL https://update.greasyfork.org/scripts/497079/BiliBili%E7%A8%BF%E4%BB%B6%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5.user.js
// @updateURL https://update.greasyfork.org/scripts/497079/BiliBili%E7%A8%BF%E4%BB%B6%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5.meta.js
// ==/UserScript==

// 存储三个profile的举报理由和tid
(function() {
    'use strict';

    // 获取当前网址
    var currentUrl = window.location.href;

    // 检查网址中是否包含video这个单词
    if (currentUrl.indexOf('video') === -1) {
        // 提取数字id
        var regex = /space\.bilibili\.com\/(\d+)/;
        var match = regex.exec(currentUrl);
        if (match) {
            var numericId = match[1];
            // 构建跳转网址
            var redirectUrl = 'https://space.bilibili.com/' + numericId + '/video?tid=0&pn=1&keyword=&order=pubdate';
            // 跳转到视频页面
            window.location.href = redirectUrl;
        }
    }
})();
function checkPage() {
        // Extract current page number from URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('pn'));

        // Get total number of pages from the page element
        const totalPagesElement = document.evaluate('//*[@id="submit-video-list"]/ul[3]/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (totalPagesElement) {
            const totalText = totalPagesElement.innerText;
            const totalMatches = totalText.match(/共 (\d+) 页/);
            if (totalMatches && totalMatches.length > 1) {
                const totalPages = parseInt(totalMatches[1]);
                console.log(totalPages)

                // Get space ID from the URL
                const spaceIdMatches = window.location.href.match(/space.bilibili.com\/(\d+)\//);
                if (spaceIdMatches && spaceIdMatches.length > 1) {
                    const spaceId = spaceIdMatches[1];

                    // Compare current page with total pages
                    if (currentPage < totalPages) {
                        // Navigate to the next page
                        const nextUrl = `https://space.bilibili.com/${spaceId}/video?tid=0&pn=${totalPages}&keyword=&order=pubdate`;
                        window.location.href = nextUrl;
                    } else {
                        // Continue with remaining code if currentPage equals totalPages
                        console.log('Current page is the last page. Continuing with the rest of the script.');
                    }
                } else {
                    console.error('Failed to extract space ID from the URL.');
                }
            } else {
                console.error('Failed to extract total pages from the page.');
            }
        } else {
            console.error('Total pages element not found.');
        }
    }

const profiles = [
  {
    tid: 3,//色情低俗
    reason: '视频封面标题以及内容违规，推广以原神、碧蓝档案等二次元游戏人物为主角的色情视频，以未成年人为主角的色情游戏，，并在置顶动态以及评论内向站外色情网站引流，严重危害青少年用户的身心健康'
  },
  {
    tid: 9,
    reason: '此视频煽动观看者引战。破坏社区风气，煽动观众举报视频'
  },
  {
    tid: 3,//色情低俗
    reason: '视频封面标题以及内容违规，推广以原神、碧蓝档案等二次元游戏人物为主角的色情视频，以未成年人为主角的色情游戏，关键词为“盯榨、捣蒜、红绿灯”的性暗示内容视频，并在充电视频，置顶动态以及评论内向站外色情网站引流'
  },
  {
    tid: 10014,//政治谣言
    reason: '视频封面标题以及内容违规，推广以原神、碧蓝档案等二次元游戏人物为主角的色情视频，以未成年人为主角的色情游戏，关键词为“盯榨、捣蒜、红绿灯”的性暗示内容视频，并在充电视频，置顶动态以及评论内向站外色情网站引流'
  },
  {
    tid: 10014, // 占位备用
    reason: '发布低俗图文及视频信息，或诱导他人私聊并推介线下色情服务；在账号资料、评论等环节，发布性暗示信息。利用黑话暗语、谐音词发布色情低俗动漫、视频、小说、游戏以及其他违法违规信息'
  }
];

let currentProfileIndex = 0; // 初始化当前使用的profile索引

function switchProfile() {
  currentProfileIndex = (currentProfileIndex + 1) % profiles.length;
  updateDiagnosticInfo(`已切换至理由 ${currentProfileIndex + 1}<br>`);
}

// 在页面上创建切换profile的按钮
function addProfileSwitchButton() {
  const switchButton = document.createElement('button');
  switchButton.textContent = '切换理由';
  switchButton.style.position = 'fixed';
  switchButton.style.top = '60px';
  switchButton.style.right = '150px';
  switchButton.style.zIndex = '9999';
  switchButton.onclick = function() {
    switchProfile();
  };
  document.body.appendChild(switchButton);
}

// Create floating window with scrollable content
const floatingWindow = document.createElement('div');
floatingWindow.style.position = 'fixed';
floatingWindow.style.top = '90px';
floatingWindow.style.right = '20px';
floatingWindow.style.zIndex = '9999';
floatingWindow.style.background = 'white';
floatingWindow.style.border = '1px solid #ccc';
floatingWindow.style.padding = '10px';
floatingWindow.style.maxWidth = '340px';
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

let delayInMilliseconds = 2000; // 设置延迟时间

// 更新 sendReportRequest 函数，在显示完最后一次举报返回值后显示“本页全部举报完成”，然后调用 clickPreviousPageButton 函数
function sendReportRequest() {
  const mid = window.location.href.match(/bilibili.com\/(\d+)\/video/)[1];
  const csrf = getCsrf();
  const xhr = new XMLHttpRequest();
  xhr.open("POST", 'https://space.bilibili.com/ajax/report/add', true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    const decodedResponse = JSON.parse(decodeURIComponent(this.response));
    updateDiagnosticInfo(`举报请求返回值：<strong>${Object.keys(decodedResponse).map(key => `${key}: ${decodedResponse[key]}`).join(', ')}</strong><br>`);
    // Call the existing functionality after the report request with a delay
    setTimeout(() => {
      getPageAllVideoAid();
    }, delayInMilliseconds);
  };
  xhr.send(`mid=${mid}&reason=1%2C3%2C2&reason_v2=3&csrf=${csrf}`);
}




function addButton() {
  // Existing button creation code remains unchanged
  // Add a call to sendReportRequest before calling the existing functionality
  const button = document.createElement('button');
  button.textContent = '自动举报所有稿件';
  button.style.position = 'fixed';
  button.style.top = '60px';
  button.style.right = '20px';// 更新 sendReportRequest 函数，在显示完最后一次举报返回值后显示“本页全部举报完成”，然后调用 clickPreviousPageButton 函数
function sendReportRequest() {
  const mid = window.location.href.match(/bilibili.com\/(\d+)\/video/)[1];
  const csrf = getCsrf();
  const xhr = new XMLHttpRequest();
  xhr.open("POST", 'https://space.bilibili.com/ajax/report/add', true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    const decodedResponse = JSON.parse(decodeURIComponent(this.response));
    updateDiagnosticInfo(`举报请求返回值：<strong>${Object.keys(decodedResponse).map(key => `${key}: ${decodedResponse[key]}`).join(', ')}</strong><br>`);
    // Call the existing functionality after the report request with a delay
    setTimeout(() => {
      getPageAllVideoAid();
    }, delayInMilliseconds);
  };
  xhr.send(`mid=${mid}&reason=1%2C3%2C2&reason_v2=3&csrf=${csrf}`);

}

  button.style.zIndex = '9999';
  button.onclick = function() {
    sendReportRequest();
  };
  document.body.appendChild(button);
}

GM_registerMenuCommand("自动举报所有稿件", fuckBilibiliShitVideo);

let csrfText = '';

function getCsrf() {
  if (csrfText === '') {
    const cook = document.cookie.match(/bili_jct=(.*?);/) ?? [];
    if (cook.length === 2) {
      csrfText = cook[1];
    }
  }
  return csrfText;
}



function clickPreviousPageButton() {
  setTimeout(() => {
    updateDiagnosticInfo('<strong style="font-size: 2em">本页全部举报成功</strong><br>');
    const previousPageButton = document.querySelector('.be-pager-prev');

    if (!previousPageButton) {
      const errorMessage = document.createElement('div');
      updateDiagnosticInfo('<strong style="font-size: 2em; color: red;">未找到上一页按钮</strong><br>');
      errorMessage.textContent = '未找到上一页按钮';
      errorMessage.style.color = 'red';
      document.body.appendChild(errorMessage);
      return; // 提前结束函数执行
    } else if (previousPageButton.classList.contains('be-pager-disabled')) {
      const errorMessage = document.createElement('div');
      errorMessage.textContent = '上一页按钮已被禁用';
      updateDiagnosticInfo('<strong style="font-size: 2em; color: red;">上一页按钮已被禁用</strong><br>');
      errorMessage.style.color = 'red';
      document.body.appendChild(errorMessage);
      return; // 提前结束函数执行
    } else {
      previousPageButton.querySelector('a').click();
      setTimeout(fuckBilibiliShitVideo, 2500);
    }
  }, 500);
}




let encounteredError352 = false; // 添加一个全局变量来跟踪是否遇到了错误 -352

let reportCount = 0; // 添加一个变量用于记录举报次数

function fuckVideo(aid) {
  reportCount++; // 每次举报增加序号
  const profile = profiles[currentProfileIndex];
  updateDiagnosticInfo(`开始举报稿件 <span style="color: red; font-weight: bold;">${reportCount}</span>，aid: ${aid}<br>`);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", 'https://api.bilibili.com/x/web-interface/appeal/v2/submit', true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.withCredentials = true;
  xhr.onload = function () {
    const responseJson = JSON.parse(this.response);
    if (responseJson.code === -352) {
      updateDiagnosticInfo('<strong style="font-size: 2em; color: red;">遇到错误 -352，请完成人机验证</strong><br>');
      if (encounteredError352 === true) {
    var newURL = `https://www.bilibili.com/appeal/?avid=${aid}`;
    var newTab = window.open(newURL, '_blank');
}
      encounteredError352 = true;
    } else {
      updateDiagnosticInfo(`举报结果：<strong>${this.response}</strong><br>`);
    }
  };
  xhr.send(`aid=${aid}&attach=&block_author=false&csrf=${getCsrf()}&desc=${encodeURIComponent(profile.reason)}&tid=${profile.tid}`);
}

async function getVideoAid(id) {
  return new Promise((resolve, reject) => { // 添加promise
    if (encounteredError352) { // 如果遇到错误 -352
      updateDiagnosticInfo('遇到错误 -352，请点击“继续”按钮以继续代码执行<br>');
      // 暂停执行，并等待点击“继续”按钮
      const continueButton = document.createElement('button');
      continueButton.textContent = '继续';
      continueButton.style.position = 'fixed';
      continueButton.style.top = '60px';
      continueButton.style.right = '235px';
      continueButton.style.zIndex = '9999';
      continueButton.onclick = function() {
        encounteredError352 = false; // 点击“继续”按钮后，将变量值改为false
        resolve(null); // 继续执行并返回null
        continueButton.remove(); // 移除“继续”按钮
      };
      document.body.appendChild(continueButton);
    } else {
      GM_xmlhttpRequest({
        url: `https://www.bilibili.com/video/${id}/?spm_id_from=333.999.0.0`,
        method: "GET",
        headers: {
          'Cookie': document.cookie // Pass the cookies from the page to the request
        },
        onload: function (response) {
          const aid = response.responseText.match(/"aid":(\d+)/);
          if (aid) {
            updateDiagnosticInfo(`成功获取到稿件，aid: ${aid[1]}<br>`);
            resolve(aid[1]);
          } else {
            updateDiagnosticInfo('无法获取稿件 aid<br>');
            resolve(null);
          }
        }
      });
    }
  });
}
async function getPageAllVideoAid() {
  const idList = [...document.querySelectorAll('.list-list .list-item')].map((dom) => dom.getAttribute('data-aid'));
  updateDiagnosticInfo(`获取到 ${idList.length} 个稿件<br>`);
  for (let index = 0; index < idList.length; index++) {
    const aid = await getVideoAid(idList[index]);
    if (aid) {
      // Add a delay before calling fuckVideo
      await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
      fuckVideo(aid);
    }
  }
clickPreviousPageButton(); // 在所有操作完成后调用点击上一页按钮的函数
}

async function fuckBilibiliShitVideo() {
  reportCount = 0; // 每次重新运行函数时重置序号
  updateDiagnosticInfo('开始自动举报所有稿件<br>');
  await getPageAllVideoAid();
  // 执行其他操作...
}
async function appeal (){
    var firstElement = document.querySelector('.item-check-btn.pink');
        if (firstElement) {
            firstElement.click();
        }

        var secondElement = document.evaluate('/html/body/div/div/div[3]/div[2]/textarea', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (secondElement) {
            secondElement.value = "fgyvcbhwvivreb";

            var inputEvent = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            secondElement.dispatchEvent(inputEvent);
        }

        var thirdElement = document.evaluate('/html/body/div/div/div[5]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (thirdElement) {
            thirdElement.click();
        }
}
// 添加一个按钮，点击后将链接中的数字写入用户剪贴板
function addCopyIdButton() {
  const userId = window.location.href.match(/bilibili.com\/(\d+)\//)[1]; // 获取链接中的数字部分
  const copyButton = document.createElement('button');
  copyButton.textContent = '复制用户ID';
  copyButton.style.position = 'fixed';
  copyButton.style.top = '60px'; // 调整按钮位置
  copyButton.style.right = '300px';
  copyButton.style.zIndex = '9999';
  copyButton.onclick = function() {
    navigator.clipboard.writeText(`${userId}\n`); // 将数字写入剪贴板并加上换行符
    updateDiagnosticInfo(`用户ID ${userId} 已复制到剪贴板`);
  };
  document.body.appendChild(copyButton);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function runAfterDelay() {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待5秒钟

    if (window.location.hostname === "space.bilibili.com" && window.location.pathname.includes("/video")) {
        checkPage();
        addButton(); // 添加举报按钮
        addProfileSwitchButton(); // 添加切换profile的按钮
        addCopyIdButton(); // 添加复制用户ID的按钮
        //fuckBilibiliShitVideo();
    }
}




window.onload = async function() {
        if (window.location.hostname === "space.bilibili.com" && window.location.pathname.includes("/video")) {
            
            runAfterDelay();
            

        }
        else {
            await sleep(1000);
            appeal();


    }
    };
