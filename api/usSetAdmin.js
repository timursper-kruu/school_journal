/**
 *   НАЗНАЧЕНИЕ/РАЗЖАЛОВАНИЕ ПОЛЬЗОВАТЕЛЯ (ИЗ) АДМИНИСТРАТОРО(М/В)
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходит массив [логин, статус], где статус - это set или unset
// Возвращает "success", "already" (если запрашиваемый статус уже
// установлен), либо "none", если пользователя с таким логином не существует
module.exports = async req => {   
   try {
      let login = req[0], oper = req[1];
      if (!login || !oper) return "none";
      
      // Проверяем, есть ли вообще учитель с таким логином
      let res = await dbFind("staff", {Ulogin: login}); 
      if (!res.length) return "none";
      
      // Получаем его текущий админский статус
      let user = res[0], status = user.admin || false;
      
      // Устанавливаем/сбрасываем статус и возвращаем результат
      if (oper == "set") {
         if (status) return "already";
         user.admin = true;
         db["staff"].update({Ulogin: login}, user, {});
      }
      else {
         if (!status) return "already";
         delete user.admin;
         db["staff"].update({Ulogin: login}, user, {});
      }     
      return "success";
   }
   catch(e) {return "none";}
};
