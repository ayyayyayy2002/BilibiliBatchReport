// ==UserScript==
// @name         Bilibili视频批量举报（新）
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  举报当前UP的所有视频，包括合集内视频，支持自动跳转人机验证
// @author       Ayyayyayy2002
// @match        https://space.bilibili.com/*
// @match        https://www.bilibili.com/appeal/*
// @grant        GM_xmlhttpRequest
// @connect      api.bilibili.com
// @icon         https://i2.hdslb.com/bfs/app/8920e6741fc2808cce5b81bc27abdbda291655d3.png@240w_240h_1c_1s_!web-avatar-space-header.avif
// @downloadURL https://update.greasyfork.org/scripts/512776/Bilibili%E8%A7%86%E9%A2%91%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5%EF%BC%88%E6%96%B0%EF%BC%89.user.js
// @updateURL https://update.greasyfork.org/scripts/512776/Bilibili%E8%A7%86%E9%A2%91%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5%EF%BC%88%E6%96%B0%EF%BC%89.meta.js
// ==/UserScript==

(function() {
    'use strict';




let reportCount = 0
let currentAidIndex = 0; // 当前处理的AID索引
let time_video = 2300
let aids = [];
let pics = [];
let titles = [];
let seasonIds= [];
const floatingWindow = document.createElement('div');// 创建诊断信息窗口
floatingWindow.style.position = 'fixed';
floatingWindow.style.top = '100px';
floatingWindow.style.right = '20px';
floatingWindow.style.zIndex = '9999';
floatingWindow.style.background = 'white';
floatingWindow.style.border = '1px solid #ccc';
floatingWindow.style.padding = '10px';
floatingWindow.style.maxWidth = '340px';
floatingWindow.style.overflow = 'auto'; // 为滚动添加溢出属性
floatingWindow.style.height = '200px';
floatingWindow.style.scrollBehavior = 'smooth'; // 启用平滑滚动
document.body.appendChild(floatingWindow);
const diagnosticInfo = document.createElement('div');// 创建诊断信息容器
floatingWindow.appendChild(diagnosticInfo);

//######################################################################################################################
//###########################################共用变量定义部分##############################################################
//######################################################################################################################

function scrollToBottom() {// 滚动到浮动窗口底部的函数
    floatingWindow.scrollTop = floatingWindow.scrollHeight;
    const lastElement = floatingWindow.lastElementChild;// 将最后一个元素滚动到视图中
    if (lastElement) {
        lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}
function updateDiagnosticInfo(content) {// 使用滚动到底部更新 diagnosticInfo.innerHTML
    diagnosticInfo.innerHTML += content;
    scrollToBottom();
}
function getCsrf() {
    let csrfText = '';
    const cookieMatch = document.cookie.match(/bili_jct=(.*?);/) ?? [];
    if (cookieMatch.length === 2) {
        csrfText = cookieMatch[1];
    }
    return csrfText;
}

//######################################################################################################################
//#################################################共用函数定义部分########################################################
//######################################################################################################################

function sendReportRequest() {
    const mid = window.location.href.match(/bilibili.com\/(\d+)/)[1];
    const csrf = getCsrf();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://space.bilibili.com/ajax/report/add', true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
        updateDiagnosticInfo(`主页：${this.response}`)
        console.warn(`主页：${this.response}`)
    };
    xhr.send(`mid=${mid}&reason=1%2C3%2C2&reason_v2=3&csrf=${csrf}`);
}

//######################################################################################################################
//###################################################举报主页部分#########################################################
//######################################################################################################################







function extractSeries() {
    return new Promise((resolve, reject) => {
        const currentUrl = window.location.href;
        const midMatch = currentUrl.match(/space\.bilibili\.com\/(\d+)/);
        if (midMatch && midMatch[1]) {
            const mid = midMatch[1];
            const apiUrl = `https://api.bilibili.com/x/polymer/web-space/seasons_series_list?mid=${mid}&page_num=1&page_size=1`;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", apiUrl);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.code === 0 && data.data && data.data.items_lists) {
                            seasonIds = data.data.items_lists.seasons_list.map(season => season.meta.season_id);// 提取 AID
                            console.log("Extracted seasonIds:", seasonIds);
                            currentAidIndex = 0; // 重置索引
                            extractSeasonAIDs(seasonIds).then(() => {
                                resolve("完成，结束");
                            }).catch(err => {
                                reject(err);
                            });
                        } else {
                            console.log("没有找到记录:", data);
                            resolve("没有找到记录，结束");
                        }
                    } catch (e) {
                        console.log("Error parsing JSON:", e);
                        reject("JSON解析错误");
                    }
                } else {
                    console.log("Failed to fetch data, status:", xhr.status);
                    reject(`请求失败，状态码: ${xhr.status}`);
                }
            };
            xhr.onerror = function(err) {
                console.log("Request failed:", err);
                reject("请求失败");
            };
            xhr.send();
        } else {
            reject("MID 提取失败");
        }
    });
}



function extractSeasonAIDs() {
    return new Promise((resolve, reject) => {
        if (currentAidIndex < seasonIds.length) {
            const seasonId = seasonIds[currentAidIndex];


            const currentUrl = window.location.href;
            const midMatch = currentUrl.match(/space\.bilibili\.com\/(\d+)/);

            if (midMatch && midMatch[1]) {
                const mid = midMatch[1];
                const apiUrl = `https://api.bilibili.com/x/polymer/space/seasons_archives_list?mid=${mid}&sort_reverse=false&season_id=${seasonId}&page_num=1&page_size=30`;
                const xhr = new XMLHttpRequest();
                xhr.open("GET", apiUrl);
                console.log(apiUrl)

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data.code === 0 && data.data && data.data.archives) {
                                aids = data.data.archives.map(archive => archive.aid); // 提取 AID
                                console.log("Extracted AIDs:", aids);

                                titles = data.data.archives.map(archive => archive.title); // 提取 title
                                console.log("Extracted Titles:", titles);

                                pics = data.data.archives.map(archive => archive.pic); // 提取 pic
                                console.log("Extracted Pics:", pics);
                                currentAidIndex = 0; // 重置索引

                                // 使用 Promise.race 设置超时机制
                                const submitPromise = submitNextAppeal(); // 假设此函数返回一个 Promise
                                const timeoutPromise = new Promise((_, reject) =>
                                    setTimeout(() => reject("提交超时"), 10000) // 10秒超时
                                );

                                Promise.race([submitPromise, timeoutPromise])
                                    .then(() => {
                                        resolve("完成，结束");
                                    })
                                    .catch(err => {
                                        console.log(err);
                                    });

                            } else {
                                console.log("没有找到记录:", data);
                                resolve("没有找到记录，结束");
                            }
                        } catch (e) {
                            console.log("Error parsing JSON:", e);
                            reject("JSON解析错误");
                        }
                    } else {
                        console.log("Failed to fetch data, status:", xhr.status);
                        reject(`请求失败，状态码: ${xhr.status}`);
                    }
                };

                xhr.onerror = function (err) {
                    console.log("Request failed:", err);
                    reject("请求失败");
                };
                xhr.send();
            } else {
                reject("MID 提取失败");
            }



        } else {
            updateDiagnosticInfo('合集举报完成!<br>');
            console.warn('合集举报完成!');
            resolve(); // 完成后解除 Promise

        }



    })
}




//######################################################################################################################
//###################################################举报合集部分#########################################################
//######################################################################################################################



            function extractAndSubmitAIDs() {
                return new Promise((resolve, reject) => {
                    const currentUrl = window.location.href;
                    const midMatch = currentUrl.match(/space\.bilibili\.com\/(\d+)/);
                    if (midMatch && midMatch[1]) {
                        const mid = midMatch[1];
                        const apiUrl = `https://api.bilibili.com/x/series/recArchivesByKeywords?mid=${mid}&keywords=&ps=0`;
                        const xhr = new XMLHttpRequest();
                        xhr.open("GET", apiUrl);
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                try {
                                    const data = JSON.parse(xhr.responseText);
                                    if (data.code === 0 && data.data && data.data.archives) {
                                        aids = data.data.archives.map(archive => archive.aid); // 提取 AID
                                        console.log("Extracted AIDs:", aids);

                                        titles = data.data.archives.map(archive => archive.title); // 提取 title
                                        console.log("Extracted Titles:", titles);

                                        pics = data.data.archives.map(archive => archive.pic); // 提取 pic
                                        console.log("Extracted Pics:", pics);
                                        currentAidIndex = 0; // 重置索引
                                        submitNextAppeal().then(() => {
                                            resolve("完成，结束");
                                        }).catch(err => {
                                            reject(err);
                                        });
                                    } else {
                                        console.log("没有找到记录:", data);
                                        resolve("没有找到记录，结束");
                                    }
                                } catch (e) {
                                    console.log("Error parsing JSON:", e);
                                    reject("JSON解析错误");
                                }
                            } else {
                                console.log("Failed to fetch data, status:", xhr.status);
                                reject(`请求失败，状态码: ${xhr.status}`);
                            }
                        };
                        xhr.onerror = function(err) {
                            console.log("Request failed:", err);
                            reject("请求失败");
                        };
                        xhr.send();
                    } else {
                        reject("MID 提取失败");
                    }
                });
            }

function submitNextAppeal() {
    reportCount++;
    return new Promise((resolve) => {
        if (currentAidIndex < aids.length) {
            const aid = aids[currentAidIndex];
            const title = titles[currentAidIndex];
            const pic = pics[currentAidIndex];
            setTimeout(() => {
                submitAppeal(aid,title,pic)
                    .then((shouldContinue) => {
                        if (!shouldContinue) {
                            resolve(); // 直接结束
                            return;     // 退出当前函数
                        }
                        currentAidIndex++;
                        submitNextAppeal().then(resolve);
                    });
            }, time_video);
        } else {
            updateDiagnosticInfo('视频举报完成!<br>');
            console.warn('视频举报完成!');


            resolve(); // 完成后解除 Promise
        }
    });
}
function submitAppeal(aid,title,pic) {
    return new Promise((resolve) => {
        const data = new URLSearchParams({
            'aid': aid,
            'attach': pic,
            'block_author': 'false',
            'csrf': getCsrf(),
            'desc': `违规行为：在视频标题${title}及评论中支持“台独”行为，并辱骂讽刺政府和领导人。诉求：下架此视频并处罚发送此视频的账号`,

            'tid': '10019'
        }).toString();
                    const xhr = new XMLHttpRequest();
                    xhr.withCredentials = true;
                    xhr.open('POST', 'https://api.bilibili.com/x/web-interface/appeal/v2/submit');
                    xhr.setRequestHeader('accept', '*/*');
                    xhr.setRequestHeader('accept-language', 'zh-CN,zh;q=0.9');
                    xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');

                    let timeoutId = setTimeout(() => {
                        updateDiagnosticInfo(`视频：请求超时<br>`);
                        console.warn(`视频：请求超时`);
                        xhr.abort(); // 超时则中止请求
                        resolve();   // 解除 Promise
                    }, 3000);

                    xhr.onload = function() {
                        clearTimeout(timeoutId);
                        if (xhr.status === 200) {
                            const result = JSON.parse(xhr.responseText);
                            updateDiagnosticInfo(`视频${reportCount}：${this.response}<br>`);
                            console.warn(`视频${reportCount}：${this.response}`)

                            if (result.code === -352) {showContinueButton(aid);
                    window.open(`https://www.bilibili.com/appeal/?avid=${aid}`, '_blank');
                    reject(`Encountered code -352 for AID ${aid}.`); // 返回拒绝
                                return;          // 退出当前函数
                            }

                            // 其他代码和状态均不处理，直接 resolve
                            resolve(true); // 正常情况下返回 true
                        } else {
                            // 对于其他状态码，不作处理，直接解除 Promise
                            updateDiagnosticInfo(`视频：${this.response}<br>`);
                            console.warn(`视频${reportCount}：${this.response}`);

                            resolve(true); // 继续执行后续逻辑
                        }
                    };

                    xhr.onerror = function(err) {
                        clearTimeout(timeoutId);
                        console.error(`请求失败:`, err);
                        resolve(true); // 请求失败时继续执行后续逻辑
                    };

//###############################################点赞视频部分#############################################################

   

//###############################################点赞视频部分#############################################################

                    xhr.send(data);
                });
            }



//######################################################################################################################
//###################################################举报视频部分#########################################################
//######################################################################################################################


//######################################################################################################################
//###################################################函数入口部分#########################################################
//######################################################################################################################

            async function main() {
                await sendReportRequest();//举报签名昵称头像
                await extractSeries();
                await extractAndSubmitAIDs(); //举报视频
            }








window.onload = function() {

    appeal ();

    createButton(); // 创建按钮

};

function createButton() {
    const button = document.createElement('button');
    button.textContent = '批量举报当前UID';
    button.style.position = 'fixed';
    button.style.top = '70px';
    button.style.right = '20px';
    button.style.zIndex = '1000'; // 确保按钮在其他元素之上
    button.onclick = main; // 点击按钮时调用函数

    document.body.appendChild(button); // 将按钮添加到页面
}

async function appeal (){
    await new Promise(resolve => setTimeout(resolve, 1000)); // 添加1000ms的延迟
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

function showContinueButton(aid) {
        const button = document.createElement('button');
        button.textContent = `继续处理下一个 AID (当前: ${aid})`;
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        button.style.padding = '10px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';

        document.body.appendChild(button);

        button.onclick = function() {
            document.body.removeChild(button);
            submitNextAppeal(); // 继续处理下一个 AID
        };
    }




})();
