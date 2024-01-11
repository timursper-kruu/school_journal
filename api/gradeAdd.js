/**
 *   ДОБАВЛЕНИЕ ОТМЕТКИ В БАЗУ ДАННЫХ ЛИБО УДАЛЕНИЕ КОЛОНКИ ОТМЕТОК
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success", либо "none", либо "pupBlock" (ребенок заблокирован),
// либо pinBad (неправильный PIN-код, если отметка выставляется после срока)
// Аргументы - [дата, класс, предмет, ученик, отметка, pin, учитель]
//   например, ["d729", "8Б-мальч", "s110", "ivanov", "нн5", "1234", "petrov"]
// Если аргумент "ученик" пустой, удаляется вся колонка отметок
const lib = require("../www/js/ini.js");
module.exports = async (argsObj) => {
   try {      
      // Проверяем, что пришло
      if (argsObj.length != 7) return "none";
      let d = argsObj[0].substr(0,  5).trim(),
          c = argsObj[1].substr(0, 20).trim(),
          s = argsObj[2].substr(0, 20).trim(),            
          p = argsObj[3].substr(0, 20).trim(),
          g = argsObj[4].substr(0,  5).trim(),
        pin = argsObj[5].substr(0,  4).trim(),
          t = argsObj[6].substr(0, 20).trim();
      if(!g) g = '';
            
      if (!d || !c || !s || !pin || !t) return "none";
      if (
         !/^d\d{3}[a-z]{0,1}$/.test(d) ||
         !/^[н0-9 ]{0,5}$/.test(g) ||
         (d.length > 4 && !/^[0-9]{0,3}$/.test(g))
      ) return "none";
      
      // Проверяем полномочия учителя на запрашиваемые класс и предмет
      if (s !== "s000") { // обычные предметы
         let distrRes = await dbFind("distrib", {tLogin: t});
         if (!distrRes.length) return "none";
         else {
            let distr = distrRes[0].tLoad;
            if (!distr[s]) return "none";
            else if (!distr[s].includes(c)) return "none";
         }
      }
      else { // внеурочка
         let distrRes = await dbFind("curric", {
            type: "intergroup", ingrName: c
         });
         if (!distrRes.length) return "none";
         else if (distrRes[0].ingrTeach !== t) return "none";
      }
      
      // Если пришел пустой ученик, удаляем всю колонку отметок
      if (!p) {
         db.grades.remove({d: d, c: c, s: s, t: t}, {multi: true});
         return "success";
      }

      // Если редактируется отм. за прошлый учебный период, проверяем PIN-код
      // (при этом текущую дату уменьшаем на один месяц)
      const dtf = d => d.toString().padStart(2, '0');
      let now   = new Date(),
          dtD   = dtf(now.getDate()),
          dtM   = dtf(now.getMonth()+1),
          dtY   = now.getFullYear(),
          dnow  = 'd' + dtY + dtM + dtD,
          dtOtm = d.substr(0,4),
          dtCur = lib.dtConv(`${dtY}-${dtM}-${dtD}`);
      dtCur = dtCur.length > 4 ? "d999" : dtCur;
      let mesyac    = Number(dtCur[1]),
          newMesyac = !mesyac ? 0 : mesyac - 1;
      dtCur = `d${newMesyac}${dtCur.slice(2)}`;
      
      if ((lib.whereIs(dtCur) > lib.whereIs(dtOtm))) {
         let clas = c.split('-')[0],
             str = t + clas + dnow + lib.dtConv(dtOtm, 1);
         let pwdTrue = '', w, h = 0;
         for (let j = 0; j < 4; j++) {
            w = global.saltpin + j + str;
            for (let i=0; i<w.length; i++) h=((h<<5)-h)+w.charCodeAt(i);
            pwdTrue += Math.abs(h) % 10;
         }
         if (pwdTrue !== pin) return "pinBad";
      }
      
      // Проверяем, есть ли такой ученик и не заблокирован ли он
      let res = await dbFind("pupils", {Ulogin: p});
      if (!res.length)  return "none";
      if (res[0].block) return "pupBlock";
      
      let success = 1;
      db.grades.update(
         {d: d, c: c, s: s, t: t, p: p},
         {d: d, c: c, s: s, t: t, p: p, g: g},
         {upsert: true},
         function (e) {if(e) success = 0;}
      );
      if (success) return "success"; else return "none";
   }
   catch(e) {return "none";}
};
