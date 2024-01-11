/**
 *   СМЕНА ПАРОЛЯ ПОЛЬЗОВАТЕЛЕМ САМОСТОЯТЕЛЬНО
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" либо "none"
module.exports = async newLogPass => {
   try {
      let login = newLogPass[0] || '',
          pass  = newLogPass[1].trim() || '';
      
      // Не слишком ли короткий пароль? Если всё ок, генерируем хэш
      if (pass.length < 8) return "none";
      pass = hash(pass, salt);
      
      // Проверяем, есть ли такой юзер
      // (только сотрудникам разрешено менять пароль)
      let res = await dbFind("staff", {Ulogin: login}); 
      if (!res.length) return "none";
      
      // Обновляем пароль
      res[0].Upwd = pass;
      db["staff"].update({Ulogin: login}, res[0], {});      
      return "success";
   }
   catch(e) {return "none";}
};
