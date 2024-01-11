/**
 *   ПОЛУЧЕНИЕ СПИСКА ДЕТЕЙ И ОТМЕТОК ДЛЯ ОДНОЙ СТРАНИЦЫ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят [класс(подгруппа), предмет, учитель]
// Возвращается none либо объект:
// {
//    puList: ["ivanov",    "petrov",    ...],
//    pnList: ["Иванов И.", "Петров П.", ...],
//    d601:   ["нн",        "5",         ...],
//    ...
// }
// Если предмет = '', то возвращаются только puList и pnList, причем
// без заблокированных учащихся
// Если предмет вида = 's000', то это внеурочка, список детей берется из
// pupils.db, где поле facult (это массив) содержит имя класса типа 30М
// В этом случае фамилия учащегося имеет вид "Иванов И.|8Б|"

// Одновременная сортировка двух массивов: первый из логинов, второй из
// фамилий (кириллицей). Сортируется второй массив по алфавиту, а первый
// массив сортируется в соответствии с отсортированным вторым.
// Возвращается массив, состоящий из двух этих отсортированных массивов 
const sort2 = (arrLat, arrRus) => {
   let arrRusNew = [...arrRus], arrLatNew = [];
   arrRusNew.sort((a, b) => a.localeCompare(b, "ru"));
   for (let i=0; i<arrRusNew.length; i++) {
      let iNew = arrRus.indexOf(arrRusNew[i]);
      arrLatNew[i] = arrLat[iNew];
   }
   return [arrLatNew, arrRusNew];
}

module.exports = async (argsObj) => {
   try {
      let gr = argsObj[0].substr(0, 20).trim(),
          sb = argsObj[1].substr(0,  4).trim(),
          lg = argsObj[2].substr(0, 20).trim();

      if (!gr || !lg) return "none";
      
      let resp = {},
          puListMain = [], puListBlock = [],
          pnListMain = [], pnListBlock = [];
      
      // Сначала формируем список учеников данного класса (подгруппы)
      // (если предмет равен s000, то это внеурочная группа)
      let clName = gr.split('-')[0];
      let findTpl = sb !== "s000" ?
         {Uclass: clName} :
         {$where: function() {
            let facField = this.facult;
            return facField ? facField.includes(clName) : false;
         }};
      let pListArr = await dbFind("pupils", findTpl);      
      
      if (pListArr.length && gr.includes('-')) // если запрошена подгруппа
         pListArr = pListArr.filter(pup => {
            if (!pup.groups) return false;
            else if (pup.groups.includes(gr)) return true;
            else return false;
         });
      
      for (let pup of pListArr) {
         let newPup = `${pup.Ufamil} ${pup.Uname[0]}.`;
         if (sb == "s000") newPup += `|${pup.Uclass}|`;
         if (pup.block) {
            if(sb) {
               puListBlock.push(pup.Ulogin);
               pnListBlock.push(newPup);               
            }            
         }
         else {
            puListMain.push(pup.Ulogin); pnListMain.push(newPup);        
         }
      }
      if (puListMain.length || puListBlock.length) {
         let arr2main = sort2(puListMain, pnListMain);
         puListMain = arr2main[0];
         pnListMain = arr2main[1];         
         if (sb) {
            let arr2block = sort2(puListBlock, pnListBlock);
            puListBlock = arr2block[0];
            pnListBlock = arr2block[1];
            resp.puList = [...puListMain, ...puListBlock];
            resp.pnList = [...pnListMain, ...pnListBlock];
         }
         else {
            resp.puList = puListMain;
            resp.pnList = pnListMain;
         }
      }
      else return "{}";
      
      // Теперь формируем объекты (по датам) с отметками (если предмет != 0)
      if (sb) {
         let grVal = resp.puList.length;
         let grResp = await dbFind("grades", {c: gr, s: sb, t: lg});      
         for (let currGr of grResp) {
            if (resp.puList.includes(currGr.p)) {
               let i = resp.puList.indexOf(currGr.p);
               if (!resp[currGr.d]) { // тогда просто массив ''
                  resp[currGr.d] = [];
                  for (let i=0; i<grVal; i++) resp[currGr.d][i] = '';
               }
               resp[currGr.d][i] = currGr.g;
            }
         }
      }
      
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
