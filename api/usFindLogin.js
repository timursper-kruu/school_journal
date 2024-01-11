/**
 *   ПРОВЕРКА ЗАНЯТОСТИ ЛОГИНА
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходит логин
// Возвращает none (ошибка на сервере), free (свободен) или busy (занят)
module.exports = async login => {
   try {
      login = login.trim().substr(0, 50);
      let dbResult1 = await dbFind("pupils", {Ulogin: login}),
          dbResult2 = await dbFind("staff",   {Ulogin: login});

      if (dbResult1.length || dbResult2.length) return "busy"
      else                                      return "free";
   }
   catch(e) {return "none";}
};
