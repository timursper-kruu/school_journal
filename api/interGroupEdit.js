/**
 *   ДОБАВЛЕНИЕ ИЛИ РЕДАКТИРОВАНИЕ ИМЕНИ СВОДНОЙ ГРУППЫ В КОЛЛЕКЦИЮ CURRIC
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В аргументах [grName, grTitle, grTeach]
// (имя группы типа 29Б; название факультатива, кружка, секции; логин учителя)
// Возвращает "success" либо "none"
module.exports = async args => {
   try {
      if (args.length != 3) return "none";
      let grName  = args[0].substr(0,   3).trim(),
          grTitle = args[1].substr(0, 100).trim(),
          grTeach = args[2].substr(0,  20).trim();

      if (!grName || !grTitle || !grTeach) return "none";
      
      // Проверяем формат пришедших имени и названия группы
      const reGrName   = /^[2-9][0-9][A-ЯЁ]{1}$/,
            reGrTitle  = /^[A-Za-z0-9А-Яа-яЁё(). \-]{2,100}$/;;
      if (!reGrName.test(grName) || !reGrTitle.test(grTitle)) return "none";
      
      // Проверяем, есть ли такой учитель и не заблокирован ли он
      let tRes = await dbFind("staff", {Ulogin: grTeach});
      if (!tRes.length)  return "none";
      if (tRes[0].block) return "none";
   
      // Добавляем или редактируем
      let success = true;
      db.curric.update(
         {type: "intergroup", ingrName: grName},
         {
            type: "intergroup", ingrName: grName,
            ingrTitle: grTitle, ingrTeach: grTeach
         },
         {upsert: true},
         function (e) {if(e) success = false;}
      );
      return success ? "success" : "none";
   }
   catch(e) {return "none";}
};
