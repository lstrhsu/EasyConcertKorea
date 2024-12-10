async function sleep(t) {
    return await new Promise(resolve => setTimeout(resolve, t));
}

function theFrame() {
    if (window._theFrameInstance == null) {
      window._theFrameInstance = document.getElementById('oneStopFrame').contentWindow;
    }
  
    return window._theFrameInstance;
}

function getConcertId() {
    return document.getElementById("prodId").value;
}

function openEverySection() {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("seat_name");
    console.log(section);
    for (let i = 0; i < section.length; i++) {
        section[i].parentElement.click();
    }
}

function clickOnArea(area) {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("area_tit");
    for (let i = 0; i < section.length; i++) {
        let reg = new RegExp(area + "\$","g");
        if (section[i].innerHTML.match(reg)) {
            section[i].parentElement.click();
            return;
        }
    }
}

async function findSeat() {
    let frame = theFrame();
    let canvas = frame.document.getElementById("ez_canvas");
    let seat = canvas.getElementsByTagName("rect");
    console.log(seat);
    await sleep(50);
    for (let i = 0; i < seat.length; i++) {
        let fillColor = seat[i].getAttribute("fill");
    
        // Check if fill color is different from #DDDDDD or none
        if (fillColor !== "#DDDDDD" && fillColor !== "none") {
            console.log("Rect with different fill color found:", seat[i]);
            var clickEvent = new Event('click', { bubbles: true });

            seat[i].dispatchEvent(clickEvent);
            frame.document.getElementById("nextTicketSelection").click();
            return true;
        }
    }
    return false;
}

async function checkCaptchaFinish() {
    if (document.getElementById("certification").style.display != "none") {
        await sleep(1000);
        checkCaptchaFinish();
        return;
    }
    let frame = theFrame();
    await sleep(500);
    frame.document.getElementById("nextTicketSelection").click();
    return;
}

async function reload() {
    let frame = theFrame();
    frame.document.getElementById("btnReloadSchedule").click();
    await sleep(500);
}

// 新增：获取座位数据
function getSeatSummaryData() {
    try {
        const data = localStorage.getItem('seatSummaryData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('获取座位数据失败:', error);
        return null;
    }
}

// 新增：获取区域的可用座位数
function getAreaAvailableSeats(areaCode) {
    // console.log(`检查区域 ${areaCode} 的可用座位数`);
    const seatData = getSeatSummaryData();
    
    if (!seatData || !seatData.summary) {
        // console.log(`没有找到座位数据，返回 0`);
        return 0;
    }
    
    // 去除空格后比较
    const trimmedAreaCode = areaCode.trim();
    const areaInfo = seatData.summary.find(item => item.areaNo.trim() === trimmedAreaCode);
    const seats = areaInfo ? areaInfo.realSeatCntlk : 0;
    // console.log(`区域 ${areaCode} (处理后: ${trimmedAreaCode}) 的可用座位数: ${seats}`);
    return seats;
}

// 新增：获取下一个应该检查的区域
function getNextArea(currentArea, sectionOrder) {
    console.log(`当前区域: ${currentArea}, 区域顺序: ${JSON.stringify(sectionOrder)}`);
    
    const seatData = getSeatSummaryData();
    if (!seatData) {
        console.log("没有座位数据，返回第一个区域");
        return sectionOrder[0];
    }

    // 找出所有有座位的区域
    const availableAreas = sectionOrder.filter(area => {
        const seats = getAreaAvailableSeats(area);
        // console.log(`区域 ${area} 可用座位数: ${seats}`);
        return seats > 0;
    });

    console.log(`有座位的区域: ${JSON.stringify(availableAreas)}`);

    if (availableAreas.length === 0) {
        // 如果没有可用座位，返回序列中的下一个区域
        const currentIndex = sectionOrder.indexOf(currentArea);
        const nextArea = sectionOrder[(currentIndex + 1) % sectionOrder.length];
        console.log(`没有可用座位，移动到下一个区域: ${nextArea}`);
        return nextArea;
    }

    // 按照原始顺序返回第一个有座位的区域
    for (let area of sectionOrder) {
        if (availableAreas.includes(area)) {
            console.log(`找到第一个有座位的区域: ${area}`);
            return area;
        }
    }
}

async function searchSeat(data) {
    // console.log("开始搜索座位，初始数据:", data);
    let currentArea = data.section[0];
    
    while (true) {
        // console.log("\n=== 新一轮搜索开始 ===");
        // console.log("展开所有区域");
        openEverySection();
        await sleep(200); // 等待座位数据更新
        
        // 获取下一个要检查的区域
        const nextArea = getNextArea(currentArea, data.section);
        // console.log(`从 ${currentArea} 移动到 ${nextArea}`);
        currentArea = nextArea;
        
        console.log(`点击区域: ${currentArea}`);
        clickOnArea(currentArea);
        await sleep(50);
        
        console.log("开始查找座位");
        if (await findSeat()) {
            console.log("找到可用座位！");
            checkCaptchaFinish();
            return;
        }
        
        // 如果所有区域都检查完还没找到座位
        if (data.section.indexOf(currentArea) === data.section.length - 1) {
            console.log("所有区域检查完毕，准备刷新");
            await reload();
            currentArea = data.section[0]; // 重置为第一个区域
            console.log("重置到第一个区域:", currentArea);
        }
    }
}

// 监听座位数据更新
window.addEventListener('seatSummaryUpdate', (event) => {
    // console.log('收到座位数据更新事件:', event.detail);
    // console.log('当前全局座位数据:', window.seatSummaryData);
});

async function waitFirstLoad() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(1000);
    searchSeat(data);
}


waitFirstLoad();