/**
 *   РАБОТА СО СПИСКОМ УЧАЩИХСЯ МЕЖКЛАССНОЙ ГРУППЫ (ДОБАВЛЕНИЕ, УДАЛЕНИЕ)
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы: ["func", grName, pupLgn, teachLgn]
//    "func"    - может быть "add" или "del"
//    grName    - имя группы типа 23Б
//    pupLgn    - логин добавляемого/удаляемого учащегося
//    teachLgn  - логин учителя, запрашивающего операцию (с фронтенда
//                не передается, подписывается скриптом index.js)
// Возвращает "success" либо "none"
module.exports = async args => {   
   try {
      if (args.length != 4) return "none";
      let func     = args[0].substr(0,  3),
          grName   = args[1].substr(0,  3),
          pupLgn   = args[2].substr(0, 20),
          teachLgn = args[3].substr(0, 20);

      if (!func || !grName || !pupLgn || !teachLgn) return "none";
      
      // Проверяем, есть ли такая группа
      let gRes = await dbFind("curric", {type: "intergroup", ingrName: grName});
      if (!gRes.length)  return "none";

      // Получаем список межклассных групп данного ученика
      let pRes = await dbFind("pupils", {Ulogin: pupLgn});
      if (!pRes.length)  return "none";
      let facList = [];
      if (pRes[0].facult) facList = pRes[0].facult;

      // Если запрос на удаление - удаляем, иначе добавляем
      if (func == "del") {
         let pos = facList.indexOf(grName);
         if (pos > -1) facList.splice(pos, 1);
      }
      else if (!facList.includes(grName)) facList.push(grName);

      // Обновляем запись в таблице учащихся
      let success = true;
      await db.pupils.update(
         {Ulogin: pupLgn}, {$set: {facult: facList}}, {},
         function (e) {if(e) success = false;}
      );
      return success ? "success" : "none";

   } catch(e) {return "none";}
};
