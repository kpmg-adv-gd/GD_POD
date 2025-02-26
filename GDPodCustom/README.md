# 🚀 POD di GD - SAPUI5

Benvenuto nel **POD di GD**, un'applicazione SAPUI5 progettata per gestire la navigazione tra viste con un'architettura scalabile e modulare.  
Il progetto utilizza un **navigator** per il routing interno, una **CommonCallManager** per gestire facilmente e ugulamente chiamate ajax e centralizza funzioni comuni in un **BaseController**, garantendo una gestione efficiente della logica di navigazione.

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
```

| Chiave             | Descrizione |
|--------------------|------------|
| **type**   | Tipo di chiamata: può essere "GET" o "POST". |
| **url**        | Per callProxy, è sempre costruito come BaseProxyUrl + path dell API (MDO, PostgresDB, ecc.) |
| **params**         | Oggetto JSON contenente i parametri da inviare nel body della richiesta. |
| **isAsync**   | Booleano per gestire chiamata sincrona/asincrona |
| **successCallback/errorCallback** | Funzioni di callback di successo/errore della chiamata |
| **oContext** |  Il contesto da cui viene chiamata la funzione, utile per accedere corretamente alle callback passate |

---

## 🎯 Conclusione
Questo progetto è stato progettato per essere:

✅ **Scalabile** → Facilmente estendibile con nuove viste  
✅ **Modulare** → Navigazione e chiamate centralizzate  
✅ **Manutenibile** → Struttura chiara e codice riutilizzabile  

---

## 💡 Prossimi sviluppi
🚀 **Integrare il supporto per API Key nella CommonCallManager** → Migliorare la sicurezza nella comunicazione tra front-end e back-end, garantendo che solo richieste autorizzate possano essere elaborate.
⚙️ **Migliorare la `callProxy` della CommonCallManager** → Estendere i parametri passati per:  
- **Gestire l'apparizione del MessageBox di errore** → Attualmente viene sempre mostrato in caso di errore.  
- **Aggiungere e gestire il BusyLoading** → Evitare blocchi dell’interfaccia durante l'attesa della risposta.  


