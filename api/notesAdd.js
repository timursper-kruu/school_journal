/**
 *   ДОБАВЛЕНИЕ ЗАМЕТКИ ДЛЯ УЧАЩЕГОСЯ И РОДИТЕЛЕЙ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы: ["ivanov", "Плохое поведение!", "petrov"]
// ivanov (вместо него может быть, например, 8Б-мальч) - для кого заметка
// petrov - логин отправителя заметки (с фронтенда не передается,
// подписывается скриптом index.js)
// Возвращает "success" или "none"
module.exports = async (args) => {
   try {
      if (args.length != 3) return "none";
      let rcpt   = args[0].substr(0,  20).trim(),
          text   = args[1].substr(0, 500).trim(),
          author = args[2].substr(0,  20).trim();

      if (!rcpt || !text || !author) return "none";
      text = text.replace(/[^а-яёА-ЯЁa-zA-Z0-9.,:;()\/\-—–_@=&!?№ ]/g, '');
      
      // Определяем полномочия отправителя (сотрудник ли он) и его имя
      let res = await dbFind("staff", {Ulogin: author});
      if (!res.length) return "none";
      let authorF =
         `${res[0].Ufamil} ${(res[0].Uname)[0]}. ${(res[0].Uotch)[0]}.`;
      
      // Определяем имя адресата (если это не целый класс)
      let rcptF = rcpt;
      if (!/^[0-9]{1,2}[А-ЯЁ]/.test(rcpt)) {
         let res = await dbFind("pupils", {Ulogin: rcpt});
         if (!res.length) return "none";
         rcptF = `${res[0].Ufamil} ${(res[0].Uname)[0]}. (${res[0].Uclass})`;
      }
      
      let dt  = new Date(),
          y   = dt.getFullYear(),
          m   = (dt.getMonth() + 1).toString().padStart(2, '0'),
          d   = dt.getDate().toString().padStart(2, '0'),
          h   = dt.getHours().toString().padStart(2, '0'),
          i   = dt.getMinutes().toString().padStart(2, '0'),
          now = `${y}-${m}-${d} ${h}:${i}`;
      
      // Пишем новую заметку в базу
      await db.notes.insert({
         dt:now, r:rcpt, rf:rcptF, t:text, a:author, af:authorF
      });
      
      return "success";
   }
   catch(e) {return "none";}
};
