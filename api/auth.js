/**
 *   АУТЕНТИФИКАЦИЯ И АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Проверка введенного юзером пароля или присланного через транспорт fetch
// токена путем сверки с хэшем пароля в базе и авторизация (определение
// полномочий) юзера. Токен отличается от пароля тем, что его первый символ
// это символ '¤'. Возвращает 0, либо JSON-строку с токеном (при первичной
// авторизации по паролю) и полномочиями:
// {
//    "token":     "¤abcde",
//    "roles":     ["admin", "teacher"],
//    "tutClss":   ["8Б", "10Ж"],
//    "teachLoad": {"8Б": ["s230", "d710"], "10Ж": ["s110"]}
// }
// Переменные salt и admPwd являются глобальными; addr - это ip юзера
// tip          - staff, pupil либо par (родитель)
// cptId        - Id капчи (таймстамп)
// capt         - собственно капча (6 цифр)
// captchaIdArr - глобальный массив, содержащий активные Id капчей
// captNumGen   - глобальная функция, генерирующая капчу по ее Id
module.exports = async (tip, login, pwd, cptId, capt, addr) => {
   try {
      // Проверяем корректность формата логина
      const pattLogin = /^[a-z0-9]+$/;
      if (!pattLogin.test(login)) return 0;
      
      // Функция проверяет капчу и возвращает 1 или 0; всегда убивает капчу
      const captCheck = () => {
         let cptIdIndex = captchaIdArr.indexOf(Number(cptId));
         if (cptIdIndex > -1) {
            captchaIdArr.splice(cptIdIndex, 1);
            if (captNumGen(cptId) != capt) return 0;
            else return 1;
         }
         else return 0;
      }
      
      // Ответ, возвращаемый в случае успешной авторизации
      let resp = {};
      
      // В какой коллекции базы искать пользователя
      // И его роль (в зависимости от tip)
      const collect = {"staff": "staff", "pupil": "pupils", "par": "pupils"};
      const uRoles  = {"staff": "teacher", "pupil": "pupil", "par": "parent"};
      
      // Номер дня от начала юникс-эры
      let dt = ~~(Date.now()/(1000 * 3600 * 24));
      
      let tokenTrue = '¤' + hash(dt+addr+login, salt);
      
      // Если он главный администратор
      if (login == "admin") {
         // Если пришел токен
         if (pwd[0] == '¤') {
            if (pwd == tokenTrue) resp.roles = ["root"];
            else return 0;
         }
         // Если пришел пароль
         else {
            // Проверяем капчу
            if (!captCheck()) return 0;
            // Проверяем пароль
            if (hash(pwd, 'z') == admPwd) resp.roles = ["root"];
            else return 0;
            // Генерируем ему токен
            resp.token = '¤' + hash(dt+addr+login, salt);
         }
      }   
      
      // Если он не главный администратор
      else {      
         // Получаем из базы соответствующую запись по логину
         if (!collect[tip]) return 0;
         let uRecord = await dbFind(collect[tip], {Ulogin: login});
         if (!uRecord.length) return 0;
            
         // Проверяем, не заблокирован ли он
         if (uRecord[0].block) return 0;
         
         // Если пришел токен
         if (pwd[0] == '¤') {
            if (pwd == tokenTrue) resp.roles = [uRoles[tip]];
            else return 0;         
         }
         
         // Если пришел пароль
         else {            
            if (!captCheck()) return 0;     // проверка капчи    
            let userHash = hash(pwd, salt); // хэш пароля         
            // Если он утверждает, что он родитель
            // Пароль родителя - это captNumGen(hash(детский_пароль, salt))
            if (tip == "par") {
               let parHash  = hash('p' + pwd, salt);
               if (uRecord[0].UpwdPar == parHash) resp.roles = ["parent"];
               else return 0;
            }            
            // Иначе он сотрудник или учащийся
            else {
               if (uRecord[0].Upwd == userHash) resp.roles = [uRoles[tip]];
               else return 0;
            }
            // Генерируем ему токен
            resp.token = '¤' + hash(dt+addr+login, salt);
         }     
         
         // Проверяем, не является ли он администратором
         if (tip == "staff" && uRecord[0].admin) resp.roles.push("admin");
         
         // Проверяем, не является ли он классным руководителем,
         // и если да, то в каких именно классах
         let tutCl = [];
         let clListArr = await dbFind("curric", {type: "class"});      
         for (let currDoc of clListArr)
            if (currDoc.tutor)
               if (currDoc.tutor == login) tutCl.push(currDoc.className);
         if (tutCl.length) {
            resp.roles.push("tutor");
            resp.tutClss = tutCl;
         }
         
         // Если он учитель, смотрим и возвращаем распределение его нагрузки
         // resp.teachLoad = {"8Б": ["s230", "d710"], "10Ж": ["s110"]}
         resp.teachLoad = {};
         let uDistrArr = await dbFind("distrib", {tLogin: login});
         if (uDistrArr.length) {
            let uDistrObj = uDistrArr[0].tLoad;
            for (let subj of Object.keys(uDistrObj)) {
               for(let clName of uDistrObj[subj]) {
                  if (resp.teachLoad[clName]) resp.teachLoad[clName].push(subj);
                  else resp.teachLoad[clName] = [subj];
               }
            }
         }
      }   
      return JSON.stringify(resp);
   }
   catch(e) {return 0;}
}
