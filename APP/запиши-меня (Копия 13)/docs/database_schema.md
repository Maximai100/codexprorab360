Directus
### **Коллекция `masters`**

*   `telegramId` (Тип: Big Integer, Уникальное, Обязательное)
*   `name` (Тип: Text)
*   `profession` (Тип: Text)
*   `photoUrl` (Тип: Text, Необязательное) - URL фотографии профиля мастера

---

### **Коллекция `services`**

*   `master` (Связь "Многие к Одному" с `masters`)
*   `name` (Тип: Text)
*   `price` (Тип: Integer)
*   `duration` (Тип: Integer)

---

### **Коллекция `appointments`**

*   `master` (Связь "Многие к Одному" с `masters`)
*   `service` (Связь "Многие к Одному" с `services`)
*   `clientName` (Тип: Text)
*   `clientPhone` (Тип: Text)
*   `clientTelegramId` (Тип: Big Integer)
*   `dateTime` (Тип: Date Time)
*   `reminderSent` (Тип: Boolean, Значение по умолчанию: `false`)