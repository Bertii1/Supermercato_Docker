<?php
// Imposta l'intestazione per una risposta JSON
header('Content-Type: application/json');

// Directory di destinazione per i file caricati
// Assicurati che questa directory esista e sia scrivibile dal server web!
$target_dir = "../media/"; // Aggiunto slash finale per coerenza

$response = [
    'status' => 'error',
];

// 1. Controlla se il file è stato effettivamente caricato tramite POST
if (!isset($_FILES["productImage"]) || $_FILES["productImage"]["error"] !== UPLOAD_ERR_OK) {
    $response['message'] = 'Nessun file inviato o errore di caricamento. Codice errore: ' . ($_FILES["productImage"]["error"] ?? 'N/A');
    echo json_encode($response);
    exit;
}

$file_name = basename($_FILES["productImage"]["name"]);
$target_file = $target_dir . $file_name;
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

// 2. Controlla se il file è un'immagine reale
// Usiamo il file temporaneo per getimagesize
$check = getimagesize($_FILES["productImage"]["tmp_name"]);
if ($check === false) {
    $response['message'] = "Il file non è un'immagine valida.";
    $uploadOk = 0;
}

// 3. Controlla se il file esiste già
if (file_exists($target_file)) {
    $response['message'] = "Spiacenti, il file esiste già. Rinomina il file o elimina quello esistente.";
    $uploadOk = 0;
}

// 4. Limita la dimensione del file (es. 5MB)
// $_FILES["productImage"]["size"] è in byte
if ($_FILES["productImage"]["size"] > 5000000) { // 5 MB
    $response['message'] = "Spiacenti, il tuo file è troppo grande. Dimensione massima consentita: 5MB.";
    $uploadOk = 0;
}

// 5. Permetti solo certi formati di file
$allowed_types = ["jpg", "jpeg", "png", "gif"];
if (!in_array($imageFileType, $allowed_types)) {
    $response['message'] = "Spiacenti, sono permessi solo file JPG, JPEG, PNG e GIF.";
    $uploadOk = 0;
}

// 6. Controlla se $uploadOk è ancora 1 (tutti i controlli sono passati)
if ($uploadOk == 0) {
    // Se qualcosa è andato storto, il messaggio di errore è già stato impostato
    echo json_encode($response);
} else {
    // 7. Se tutti i controlli sono passati, tenta di caricare il file
    if (move_uploaded_file($_FILES["productImage"]["tmp_name"], $target_file)) {
        $response['status'] = 'success';
        $response['file_path'] = $target_file; // Utile per il frontend
    } else {
        $response['message'] = "Spiacenti, c'è stato un errore durante il caricamento del tuo file.";
    }
    echo json_encode($response);
}

// Funzione per la gestione degli errori di upload PHP (per debug)
// Non è strettamente necessaria per il funzionamento, ma utile per capire i codici di errore
function getUploadErrorMessage($code) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return "Il file caricato eccede la direttiva upload_max_filesize in php.ini.";
        case UPLOAD_ERR_FORM_SIZE:
            return "Il file caricato eccede la direttiva MAX_FILE_SIZE specificata nel form HTML.";
        case UPLOAD_ERR_PARTIAL:
            return "Il file è stato caricato solo parzialmente.";
        case UPLOAD_ERR_NO_FILE:
            return "Nessun file è stato caricato.";
        case UPLOAD_ERR_NO_TMP_DIR:
            return "Manca una cartella temporanea.";
        case UPLOAD_ERR_CANT_WRITE:
            return "Fallito lo scrivere il file su disco.";
        case UPLOAD_ERR_EXTENSION:
            return "Una estensione PHP ha bloccato il caricamento del file.";
        default:
            return "Errore di upload sconosciuto.";
    }
}
?>