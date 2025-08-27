const baseUrl = ""; // Write your public domain
let userInput = ''

function isYouTubeVideo(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/;
    return regex.test(url);
}

function send_url() {
    userInput = document.getElementById('url-input').value.trim().split('&')[0];
    document.getElementById('url-input').value = ''

    if (userInput == '' || !isYouTubeVideo(userInput)) {
        return;
    }

    // Step 1: Start the job
    fetch(baseUrl + "/process", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ input: userInput })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        pollForProgress();
    })
    .catch(error => {
        console.error("Error starting job:", error);
    });
}

function pollForProgress() {
    const pollInterval = 1000; // Poll every 1 second

    const poll = () => {
        fetch(baseUrl + "/status", {
            method: "GET",
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {

            // Check if job is done
            if (data.status === "ready") {
                updateProgressBar(data.percentage, data.details);
                downloadFile();
                setTimeout(poll, pollInterval);
            } else if (data.status === "running") {
                setTimeout(poll, pollInterval);
                updateProgressBar(data.percentage, data.details);
            } else if (data.status === "idle") {
                hideProgressBar();
            } else {
                console.error("Unknown status:", data.status);
            }
        })
        .catch(error => {
            console.error("Error polling progress:", error);
            // Retry after a delay
            setTimeout(poll, pollInterval * 2);
        });
    };

    // Start polling
    poll();
}

function downloadFile() {
    fetch(baseUrl + "/download", {
        method: "GET",
        headers: {
            "ngrok-skip-browser-warning": "true"
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = userInput.split('v=')[1]  + '.ipynb'; // Match the actual filename
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error("Error downloading file:", error);
    });
}

function updateProgressBar(percentage, details) {
    document.getElementById('progress-bar-container').style.display = 'block'
    document.getElementById('url-container').style.display = 'none'
    document.getElementById('progress-bar-front').style.width = percentage
    if (percentage === '0.0%')
    {
        document.getElementById('progress-percentage').innerHTML = ''
    }
    else
    {
        document.getElementById('progress-percentage').innerHTML = percentage
    }
    document.getElementById('progress-details').innerHTML = details
}

function hideProgressBar() {
    document.getElementById('progress-bar-container').style.display = 'none'
    document.getElementById('url-container').style.display = 'flex'
}

pollForProgress();