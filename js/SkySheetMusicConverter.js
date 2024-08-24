// 這個function主要用來處理輸入的譜
function processInput() {
  //取得輸入資料
  const inputValue = document.getElementById("userInput").value;
  console.log("使用者輸入:", inputValue);
  let output = "";
  // 用來追蹤最後一個字符是否為空白
  let charSpace = false;
  //使用split函數將輸入資料變成字符陣列
  const inputChars = inputValue.split("");
  //length是陣列的屬性，屬性必為正整數，這裡應用則為變成檢查所有陣列內容的篩選條件
  for (let i = 0; i < inputChars.length; i++) {
    //這裡換檢查出現字母A時，利用!isNaN檢查後面一個字串是跟著有效數字
    if (
      inputChars[i] === "A" &&
      i + 1 < inputChars.length &&
      !isNaN(inputChars[i + 1])
    ) {
      if (output.length > 0 && !charSpace) {
        output += " ";
      }
      output += inputChars[i + 1];
      charSpace = false;
      i++;
    } else if (
      inputChars[i] === "B" &&
      i + 1 < inputChars.length &&
      !isNaN(inputChars[i + 1])
    ) {
      if (output.length > 0 && !charSpace) {
        output += " ";
      }
      //parseInt函數用於將字串轉換為整數，語法parseInt(string, radix);另外radix可以設定2~36進制。
      const num = parseInt(inputChars[i + 1]);
      //這裡確保B只會有B1~B5這個範圍，對應6~10。
      if (num >= 1 && num <= 5) {
        output += num + 5;
      }
      charSpace = false;
      i++;
    } else if (
      inputChars[i] === "C" &&
      i + 1 < inputChars.length &&
      !isNaN(inputChars[i + 1])
    ) {
      if (output.length > 0 && !charSpace) {
        output += " ";
      }
      //parseInt函數用於將字串轉換為整數，語法parseInt(string, radix);另外radix可以設定2~36進制。
      const num = parseInt(inputChars[i + 1]);
      //這裡確保C只會有C1~C5這個範圍，對應10~15。
      if (num >= 1 && num <= 5) {
        output += num + 10;
      }
      charSpace = false;
      i++;
    }
    // 檢查是否有.這個陣列內容
    else if (inputChars[i] === ".") {
      //檢查第一個.之後是否有包含下一個.的存在
      if (
        i > 0 &&
        inputChars[i - 1] === " " &&
        inputChars[i + 1] === " " &&
        inputChars[i + 2] === "." &&
        inputChars[i + 3] === " " &&
        inputChars[i + 4] === "." &&
        inputChars[i + 5] === " " &&
        inputChars[i + 6] === "." &&
        inputChars[i + 7] === " " &&
        inputChars[i + 8] === "." &&
        inputChars[i + 9] === " "
      ) {
        output += "f";
        i += 8;
      } else if (
        i > 0 &&
        inputChars[i - 1] === " " &&
        inputChars[i + 1] === " " &&
        inputChars[i + 2] === "." &&
        inputChars[i + 3] === " " &&
        inputChars[i + 4] === "." &&
        inputChars[i + 5] === " " &&
        inputChars[i + 6] === "." &&
        inputChars[i + 7] === " "
      ) {
        output += "g";
        i += 6;
      } else if (
        i > 0 &&
        inputChars[i - 1] === " " &&
        inputChars[i + 1] === " " &&
        inputChars[i + 2] === "." &&
        inputChars[i + 3] === " " &&
        inputChars[i + 4] === "." &&
        inputChars[i + 5] === " "
      ) {
        output += "h";
        i += 4;
      } else if (
        i > 0 &&
        inputChars[i - 1] === " " &&
        inputChars[i + 1] === " " &&
        inputChars[i + 2] === "." &&
        inputChars[i + 3] === " "
      ) {
        output += "j";
        i += 2;
      } else {
        output += "l";
      }
    } else {
      output += inputChars[i];
    }
  }
  document.getElementById("result").innerText = output;
  console.log("轉換輸出:", output);
}
//複製結果
function copyToClipboard() {
  const resultText = document.getElementById("result").innerText;
  navigator.clipboard
    .writeText(resultText)
    .then(() => {
      alert("結果已複製到剪貼簿!");
    })
    .catch((err) => {
      console.error("複製失敗:", err);
    });
}
//一鍵清除
function clearInput() {
  document.getElementById("userInput").value = "";
}
