/**
 *   ИМПОРТ ПОЛЬЗОВАТЕЛЕЙ ИЗ ФАЙЛА
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Формат импортируемого файла - см. www/static/impUsTpl.html
// Возвращает строку вида "12-3" (количество добавленных и пропущенных),
// либо "none". Если формат какой-либо строки неверен, возвращает строку вида
// "pupkin" (логин пользователя, на котором возникла ошибка)
module.exports = async impUsStr => {   
   try {
      let n = 0, m = 0; // добавленные и пропущенные пользователи
      let usStrArr = impUsStr.trim().replace(/\s{2,}/g, ' ').split('^');
      
      for (let currStr of usStrArr) {
         currStr = currStr.trim(); if (!currStr) continue; else n++;
         let usFields = currStr.split(' ');
         let usLogin = usFields[0].trim(),
             usPassw = usFields[1].trim(),
             usFamil = usFields[2].trim(),
             usName  = usFields[3].trim(),
             usOtch  = usFields[4].trim(),
             usClass = usFields[5].trim();
         if (!(usPassw && usFamil && usName && usOtch && usClass))
            return usLogin;
         
         const pattClass = /(^\d{1,2}[A-Я]{1}$)|(none)/,
               pattFio   = /^[A-ЯЁа-яё\-]+$/,
               pattLogin = /^[a-z0-9]+$/;
         if (
            !pattLogin.test(usLogin) || !pattFio.test(usFamil) ||
            !pattFio.test(usName)    || !pattFio.test(usOtch)  ||
            !pattClass.test(usClass)
         ) return usLogin;
         
         // Имя коллекции для добавления
         let collect = (usClass == "none") ? "staff" : "pupils";
         
         // Проверяем, нет ли уже юзера с таким же логином,
         // если нет - добавляем, если есть - пропускаем
         let res = await dbFind(collect, {Ulogin: usLogin});   
         if (!res.length) {
            let newUser =
               {"Ulogin": usLogin, "Ufamil": usFamil, "Uname": usName};
            newUser.Upwd = hash(usPassw, salt); // хэш пароля
            if (collect == "pupils") {
               // Добавляем хэш родительского пароля и класс
               newUser.UpwdPar = hash('p' + captNumGen(newUser.Upwd), salt);
               newUser.Uclass = usClass;
            }
            else newUser.Uotch = usOtch;
            db[collect].insert(newUser);
         }
         else {n--, m++}
      }
      return `${n}-${m}`;
   }
   catch(e) {return "none";}
};
