// 農安知識卡與限定卡（文案暫定，正式版經本所專業審定；卡片可由管理後台新增）
export const KNOWLEDGE_CARDS = [
  { no: 1, title: '三章一Q', icon: 'cabbage',
    text: '有機農產品標章、產銷履歷農產品標章、優良農產品標章（CAS），加上臺灣農產品生產追溯 QR Code，合稱「三章一Q」，是選購安全農產品的好幫手。' },
  { no: 2, title: '有機農產品標章', icon: 'cabbage',
    text: '經驗證的有機農產品，生產過程不使用化學農藥與化學肥料，同時兼顧友善環境。' },
  { no: 3, title: '優良農產品標章（CAS）', icon: 'tomato',
    text: 'CAS 標章代表國產農產品及其加工品品質優良、衛生安全，是值得信賴的國產好品質。' },
  { no: 4, title: '產銷履歷農產品標章', icon: 'carrot',
    text: '經第三方驗證，完整記錄從生產到銷售的過程，掃描或上網就能查詢生產資訊。' },
  { no: 5, title: '生產追溯 QR Code', icon: 'tomato',
    text: '用手機掃描農產品上的 QR Code，就能看到生產者與產地等資訊，吃得安心又放心。' },
  { no: 6, title: '農藥殘留容許量', icon: 'carrot',
    text: '政府訂定農產品中農藥殘留的安全上限，符合規定的農產品可以安心食用。' },
  { no: 7, title: '蔬果清洗', icon: 'wash',
    text: '蔬果先用清水浸泡，再以流動的小水流仔細沖洗；要削皮的蔬果，也要先洗再削。' },
  { no: 8, title: '安全採收期', icon: 'carrot',
    text: '農民使用農藥後，要等待規定的天數才能採收，讓農藥自然分解，這段時間就是安全採收期。' },
  { no: 9, title: '當季蔬果', icon: 'cabbage',
    text: '選擇當季、在地的蔬果，新鮮又美味，還能減少長途運輸的能源消耗。' },
  { no: 10, title: '均衡飲食', icon: 'tomato',
    text: '每天吃足蔬菜和水果，再搭配其他各類食物，營養才會均衡。' },
];

// 限定卡：集滿 10 張知識卡後，繼續過關依序取得，並解鎖特殊功能
export const LIMITED_CARDS = [
  { no: 'L1', title: '季節限定：草莓', icon: 'tomato', feature: 'skin2',
    text: '臺灣草莓主要產季在冬天到春天。挑選草莓時，選擇果實飽滿、色澤鮮紅、蒂頭翠綠的最新鮮。',
    featureText: '解鎖小安替換造型「草莓帽」' },
  { no: 'L2', title: '季節限定：西瓜', icon: 'tomato', feature: 'bgNight',
    text: '西瓜是夏天的當季水果。切西瓜前，記得先把外皮清洗乾淨，避免表皮的髒污沾到果肉。',
    featureText: '解鎖關卡背景「夜間農田」' },
  { no: 'L3', title: '葉菜清洗小撇步', icon: 'wash', feature: 'speed',
    text: '清洗葉菜類時，先切除根部，再把葉片一片片剝開，用流動的清水沖洗乾淨。',
    featureText: '解鎖特殊功能「移動速度加快」' },
];

export const ALL_CARDS = [...KNOWLEDGE_CARDS, ...LIMITED_CARDS];

// 造型與背景：解鎖條件（暫定）
export const SKINS = [
  { id: 'base',  name: '小安',       texture: 'head',  unlock: () => true, cond: '預設' },
  { id: 'skin1', name: '小安・草帽', texture: 'head1', unlock: s => s.cards >= 10, cond: '集滿 10 張知識卡' },
  { id: 'skin2', name: '小安・草莓帽', texture: 'head2', unlock: s => s.cards >= 11, cond: '取得限定卡「草莓」' },
];
export const BACKGROUNDS = [
  { id: 'field', name: '綠作物農田', unlock: () => true, cond: '預設' },
  { id: 'soil',  name: '翻耕農地',   unlock: s => s.cards >= 5, cond: '集滿 5 張知識卡' },
  { id: 'night', name: '夜間農田',   unlock: s => s.cards >= 12, cond: '取得限定卡「西瓜」' },
];
