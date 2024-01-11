/**
 *   УДАЛЕНИЕ ЗАМЕТКИ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы: ["hgjThg", "ivanov"] (id заметки и логин сотрудника;
// логин с фронтенда не передается, подписывается скриптом index.js)
// Возвращает "success" или "none"
module.exports = async (args) => {
   try {
      if (args.length != 2) return "none";
      let id    = args[0].substr(0, 50).trim(),
          staff = args[1].substr(0, 20).trim();

      if (!id || !staff) return "none";
      
      // Его ли это заметка? Если да - удаляем
      let res = await dbFind("notes", {_id: id});
      if (res.length) if (res[0].a == staff)
         await db.notes.remove({_id: id}, {});
      
      return "success";
   }
   catch(e) {return "none";}
};
