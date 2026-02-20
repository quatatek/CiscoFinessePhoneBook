# Quata TEK Phonebook Gadget for Cisco Finesse

A modern, responsive Phone Book management gadget for Cisco Finesse. This tool allows authorized personnel to manage contact lists through a professional interface directly within the Finesse Desktop.

## 🚀 Features

* **Real-Time Search:** Instantly filter contacts by name, phone number, or description with visual term highlighting.
* **Complete Contact Management:** Built-in functionality to Add, Edit, and Delete (single or bulk) contacts.
* **Modern UI:** Developed with a clean aesthetic using the "claro" class and a responsive flexbox layout.
* **Adaptive Layout:** Features a scrollable table area that dynamically adjusts its height based on the Finesse container size.
* **Confirmation Workflows:** Safety checks for destructive actions, such as deleting multiple contacts.

## 🛡️ Security Considerations (Action Required)

### ⚠️ Hardcoded Administrator Credentials
Cisco Finesse does not allow Phonebook update without Finsesse administrator privilege. The current implementation of this gadget utilizes **hardcoded Basic Authentication** within the JavaScript file to interact with the Finesse API.

* **Security Risk:** Because the credentials reside in `PhoneBook.js`, they are technically visible to anyone with access to the browser's developer tools.
* **Best Practice - Dedicated Admin:** It is strongly recommended to create a **separate, dedicated administrator user** (e.g., `peo_phonebook`) specifically for this gadget.
* **Account Isolation:** By using a unique service account, you can quickly block or disable that specific user if security is compromised, without impacting your primary system administrators.


### Access Control
To maintain data integrity, this gadget should **only be deployed to Supervisor or specific Team layouts**. Restricting the gadget to these groups ensures that standard agents cannot modify or delete critical phonebook entries.

## 🛠️ Installation

1.  **Create Finesse Administrator Account:** Create account in CUCM, assign the administrator's privilege in UCCX..
2.  **Modify Credentials:** Update `PhoneBook.js` with your dedicated service account details.
3.  **Upload Files:** Login to UCCX (both server) using 3rdparty gadget account. Create a folder in 3rdpartygadget/files. Place `PhoneBook.xml`, `PhoneBook.js`, and `PhoneBook.css` in the newly created location .
4.  **Layout Configuration:** Add the gadget URL to the desired Supervisor/Team XML layout:
    ```xml
    <gadget>https://<finesse-fqdn>/3rdpartygadget/files/<Phone Book Directory>/PhoneBook.xml</gadget>
    ```

## 📄 License

This project is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation**, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [LICENSE](LICENSE) file for details.

## 📄 Screenshots

### Menu

<img width="105" height="515" alt="image" src="https://github.com/user-attachments/assets/22527b3d-1edb-4ce8-84c1-c8c5958bb520" />

### Layout
* Control Button– Refresh, Add and Delete
* Search Box
* Phone Book Area
* Add/Edit Area

<img width="932" height="208" alt="image" src="https://github.com/user-attachments/assets/cffdfa7e-aedb-45e6-b200-f7b568a40d5e" />

### Search
* On the search field, start typing, the search works on any field on the contact.

<img width="940" height="180" alt="image" src="https://github.com/user-attachments/assets/28730962-766e-4ea7-9778-679b06b659c7" />

### Add
* Click on the “Add Contact”
* Fill up the form at bottom. Please mindful of adding addition 0 at the front with original number.
* Once complete, click on Save.
* Click on Refresh to see the new number in the phone book.
* Once added, the number will not automatically show up the Dialpad. Agent needs to Sign out and Sign in to use Dialpad to call the number

<img width="940" height="462" alt="image" src="https://github.com/user-attachments/assets/b043e25e-e3c0-4a9f-8da1-6fe7514bb10f" />

### Update
* Click on the Edit button, right side of the contact, you can use the search option to narrow down the phone book display.
* The Entry form will open at the bottom of the page.
* Edit and click on save.
* Click on Refresh to see the new number in the phone book.
* Once added, the number will not automatically show up the Dialpad. Agent needs to Sign out and Sign in to use Dialpad to call the number

<img width="940" height="459" alt="image" src="https://github.com/user-attachments/assets/b0b893e0-a846-4afa-a0a7-3ef2e1f30393" />

Delete
* Select the contact by click the box left of the contact. Multiple contact can be selected.
* Click on the Delete button. Be sure of deleting contact, it can be reversed.
* Click on OK on the Confirmation Pop up.
* Click on the Refresh button

<img width="940" height="290" alt="image" src="https://github.com/user-attachments/assets/9748e526-a63e-4b8e-8144-e2f8a92d378e" />


### Contact
info@quatatek.com.au




