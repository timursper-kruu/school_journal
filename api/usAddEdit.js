/**
 *   ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ПОЛЬЗОВАТЕЛЯ
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" либо "none"
module.exports = async newUser => {   
   try {
      // Определяем имя коллекции, в которую будем писать
      let collect = (newUser.Ucateg == "Учащийся") ? "pupils" : "staff";
      delete newUser.Ucateg;
      
      // Не пуст ли пароль? Если не пуст, генерируем хэши
      newUser.Upwd = newUser.Upwd.trim();
      if (!newUser.Upwd) return "none";
      let pwdOrig = newUser.Upwd;
      newUser.Upwd = hash(newUser.Upwd, salt); // хэш пароля
      if (collect == "pupils")                 // хэш родительского пароля
         newUser.UpwdPar = hash('p' + captNumGen(newUser.Upwd), salt);
   
      // Проверяем, нет ли уже юзера с таким же логином,
      // если нет - добавляем, если есть - обновляем
      // Пароль обновляем только тогда, когда он не равен восьми *
      // (признак того, что данные редактировались, но пароль не трогали)
      let res = await dbFind(collect, {Ulogin: newUser.Ulogin}); 
      if (res.length) {
         if (pwdOrig == "********") {
            newUser.Upwd = res[0].Upwd;
            if (collect == "pupils") newUser.UpwdPar = res[0].UpwdPar;
         }
         if (res[0].groups) newUser.groups = res[0].groups;
         if (res[0].facult) newUser.facult = res[0].facult;
         db[collect].update({Ulogin: newUser.Ulogin}, newUser, {});
      }
      else db[collect].insert(newUser);
      
      return "success";
   }
   catch(e) {return "none";}
};
