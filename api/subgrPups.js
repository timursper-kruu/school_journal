/**
 *   РЕДАКТИРОВАНИЕ СПИСОЧНОГО СОСТАВА ПОДГРУППЫ КЛАССА
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Приходит массив с названием подгруппы и логинами ее членов, например
// ["8Б-мальч", "ivanov", "petrov", "sidorov", "pupkin"]
// Последний логин - логин классного руководителя
// (с фронтенда не передается, подписывается скриптом index.js)
// Возвращает "success" или "none"
module.exports = async (args) => {
   try {
      args = args.map(x => x.substr(0, 20).trim());
      let grName = args[0];
      if (!/^\d{1,2}[A-Я]{1}-[а-яё0-9]{1,10}$/.test(grName)) return "none";
      let clName = grName.split('-')[0];
      let klRuk = args.pop();

      // Получаем объект запрашиваемого класса, есть ли там эта подгруппа?
      let clRes = await dbFind("curric", {type: "class", className: clName});
      if (!clRes.length) return "none";      
      let clObj = clRes[0];
      let gr = clObj.groups;
      if (!gr.includes(grName)) return "none";
      
      // Проверяем полномочия классного руководителя на запрашиваемый класс
      if (clObj.tutor != klRuk) return "none";
      
      // Переписываем списочек подгрупп у каждого ученика
      // (идем циклом по всем ученикам данного класса)
      let pupilsArr = await dbFind("pupils", {Uclass: clName});
      if (!pupilsArr.length) return "none";
      for (let pupil of pupilsArr) {
         let flag = 0;
         // Если у ученика уже есть какой-то список подгрупп
         if (pupil.groups) {
            // Его логин пришел в списке аргументов для добавления в подгруппу
            if (args.includes(pupil.Ulogin)) {
               if (!pupil.groups.includes(grName)) {
                  flag = 1;
                  pupil.groups.push(grName);
               }
            }
            // Если его логин не пришел, подгруппы не должно быть в его списке
            else {
               if (pupil.groups.includes(grName)) {
                  flag = 1;
                  pupil.groups.splice(pupil.groups.indexOf(grName), 1);
               }
            }
         }
         // Если у него вообще никакого списка подгрупп еще нет,
         // а его логин пришел в аргументах для добавления в подгруппу
         else if (args.includes(pupil.Ulogin)) {
            flag = 1;
            pupil.groups = [grName];
         }
         
         if (flag) await db["pupils"].update({Ulogin: pupil.Ulogin}, pupil, {});
      }
      return "success";
   }
   catch(e) {return "none";}
};
