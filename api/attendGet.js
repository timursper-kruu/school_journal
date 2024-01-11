/**
 *   ПОЛУЧЕНИЕ ДАННЫХ ОБ ОТСУТСТВУЮЩИХ ЗА ОДИН ДЕНЬ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят ["d123", "petrov"]
//    d123 - это дата
//  petrov - это логин автора запроса (подписывается скриптом index.js)
// 
// Возвращается объект (ни классы, ни люди не отсортированы) вида
// {"10Б": {"Иванов Василий": ["s430", "s210"], ...}}
// (массив это коды предметов, пропущенных учеником в этот день)
module.exports = async (args) => {
   let resp = {}, respItog = {}, attResp = [];
   try {
      if (args.length != 2) return "none";
      let dt = args[0].substr(0, 4),          
          lg = args[1].substr(0, 20).trim();

      if (!dt || !lg || !/^d[0-9]{3}$/.test(dt)) return "none";
      
      // Проверяем полномочия автора запроса
      let res = await dbFind("staff", {Ulogin: lg});
      if (!res.length) return "none";

      // Разрешение логина учащегося в фамилию и имя
      const pupGet = async pupLgn => {
         let pupRes = await dbFind("pupils", {Ulogin: pupLgn});
         return pupRes.length ?
            pupRes[0].Ufamil + ' ' + pupRes[0].Uname :
            pupLgn;
      }

      // Фильтрация ответа базы (только отметки с буквами "н")
      // и формирование результата
      const result = async respArr => {
         for (let gr of respArr) {
            let grade = gr.g, clss = gr.c.split('-')[0], subj = gr.s;
            if (subj == "s000") continue;
            if (!grade.includes('н')) continue;
            let pupil = await pupGet(gr.p);

            if (!resp[clss]) resp[clss] = {};
            if (!resp[clss][pupil]) resp[clss][pupil] = [];
            resp[clss][pupil].push(subj);
         }         
      }

      // Если автор запроса администратор
      if (res[0].admin) {      
         attResp = await dbFind("grades", {d: dt});
         await result(attResp);
      }
      else {         
         let clArr = [];

         // В каких классах он классный руководитель
         let clResp = await dbFind("curric", {type: "class", tutor: lg});
         for (let currCl of clResp) clArr.push(currCl.className);

         // В каких классах у него учебная нагрузка
         clResp = await dbFind("distrib", {tLogin: lg});
         if (clResp[0]) for (let subj of Object.keys(clResp[0].tLoad))
            clArr.push(...(clResp[0].tLoad[subj]));

         let classes = new Set(clArr);
         for (let cl of classes) {
            attResp = await dbFind("grades", {d: dt, c: RegExp('^'+cl)});
            await result(attResp);
         }
      }
      return JSON.stringify(resp);
   }
   catch(e) {console.info(e); return "none";}
};
