# GK2 Vagtplan App

Dette projekt er en mobil applikation udviklet i React Native med Expo og Firebase Realtime Database som backend.  


---

## Funktioner fra GK1 som er bevaret og som der er blevet bygget ovenpå og opdateret 

- **Brugerregistrering**  
  Medarbejdere kan oprette en profil med oplysninger som navn, adresse, fødselsdato, land og virksomhedskode.  
  Når en bruger oprettes, sendes informationerne til virksomhedens leder, som skal godkende medarbejderen.

- **Login-system**  
  Brugere logger ind med email og virksomhedskode.  
  - Admins sendes til et admin-dashboard.  
  - Medarbejdere sendes til deres eget område med vagtplan og kontrakt.  

- **Admin-dashbord**  
  Admins kan:
  - Godkende eller afvise nye medarbejdere.  
  - Se en oversigt over alle medarbejdere.  
  - Se underskrevne kontrakter.  

- **Vagtliste**  
  Medarbejdere kan se en oversigt over deres kommende vagter, hentet direkte fra Firebase.

- **Kontrakt**  
  Medarbejderen kan læse sin kontrakt og underskrive digitalt med finger direkte i appen.  
  Når kontrakten er underskrevet, bliver den gemt i Firebase og kan ses af både medarbejderen og admin.

- **Navigation**  
  - Burgermenu til medarbejdere og admin med nem adgang til funktioner.  
  - Log-ud funktion, så brugeren kan vende tilbage til login-skærmen.  

- **Vagter**
  - Det er muligt for admin at oprette vagter og tilknytte registeret medarbejdere i virksomheden til disse. 
  - 

-**Medarbejder staus**
  - Admin kan nu også se hvor langt medarbejderen er i de oprettelse. 
  - Godkendt(Kontrakt underskrevet), Godkendt(Mangler at underskrive kontrakt), Afventer godkendelse 

-**Dashboard** 
  - Oversigt for admin over medarbejdere, vagter, arbejdstimer og økonomi. 

-**Events** 
  - Admin kan oprette events og tilføje udgifter. 

## Demo

Demovideoen:
https://youtu.be/7OrXdsn26lc

---

## Installation

1. Klon projektet eller download koden.  
2. Kør `npm install` for at installere afhængigheder.  
3. Start appen med:  
   ```bash
   npx expo start
