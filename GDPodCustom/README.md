# 🚀 POD di GD - SAPUI5

Benvenuto nel **POD di GD**, un'applicazione SAPUI5 progettata per gestire la navigazione tra viste con un'architettura scalabile e modulare.  
Il progetto utilizza un **navigator** per il routing interno e centralizza funzioni comuni in un **BaseController**, garantendo una gestione efficiente della logica di navigazione e delle chiamate AJAX.  

## 📌 Struttura dell'Applicazione

### 🏠 MainView
Quando il POD viene reindirizzato, viene caricata la `MainView`, che contiene esclusivamente un **navigator**.  
Dal `MainViewController`, vengono caricate nel navigator due viste principali:
- **🔹 PodSelectionView**
- **🔹 MainPod**

Il **navigator** permette di gestire il routing dell'applicazione, facilitando future estensioni.

---

## 🔄 Navigazione & Best Practice
Tutti i controller estendono il `BaseController`, che centralizza funzioni riutilizzabili per evitare duplicazioni di codice.

🔹 **Funzioni di Navigazione Principali**:
- `navigateToPodSelectionView()`
- `navigateToMainPod()`

🔹 **Best Practice**:
Poiché l'evento `onAfterRendering` **non** viene eseguito ogni volta che si cambia vista con il navigator, è stata adottata una strategia:
1. **Prima di navigare**, si esegue la funzione `onNavigateTo` nel controller della vista di destinazione (se presente).
2. Questo garantisce che la vista riceva sempre i dati più aggiornati.

---

## 📊 Modello Globale: InfoModel
L'`InfoModel` è il **modello globale** accessibile da tutti i controller e contiene le seguenti informazioni essenziali:

| Chiave             | Descrizione |
|--------------------|------------|
| **BaseProxyUrl**   | URL base per le chiamate AJAX |
| **user_id**        | ID dell'utente |
| **plant**         | Impianto selezionato |
| **selectedSfc**   | SFC selezionato in `PodSelectionView` |
| **selectedOperation** | Operazione selezionata in `MainPod` |

---

## ⚡ CommonCallManager - Gestione Centralizzata delle Chiamate AJAX
Per ottimizzare le chiamate AJAX, è stata creata la **CommonCallManager**, che centralizza tutte le richieste.  

🔹 **Funzione principale: `callProxy`**  
Questa funzione accetta i seguenti parametri:

```js
callProxy(type, url, params, isAsync, successCallback, errorCallback, oContext)
