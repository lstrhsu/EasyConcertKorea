// 创建并注入外部脚本
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/melonticket/injected.js');
document.documentElement.appendChild(script);
script.onload = function() {
    this.remove();
};

// 监听来自注入脚本的消息
window.addEventListener('seatDataUpdate', function(event) {
    // console.log("Content script 收到座位数据更新:", event.detail);
    const data = event.detail;
    
    if (data && data.summary) {
        // console.log("处理座位数据摘要:");
        data.summary.forEach(item => {
            // console.log(`区域 ${item.areaNo}: 可用座位数 ${item.realSeatCntlk}`);
        });
        
        // 触发事件通知其他 content scripts
        window.dispatchEvent(new CustomEvent('seatSummaryUpdate', { 
            detail: data 
        }));
    }
});