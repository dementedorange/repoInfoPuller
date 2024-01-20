let currentPage = 1;
let totalPages = 1;

function fetchUserData() {
    const username = $('#username').val();
    const userUrl = `https://api.github.com/users/${username}`;
    const cacheKey = `userData_${username}`;

    const cachedData = getCachedData(cacheKey);
    if (cachedData && !isCacheExpired(cachedData.timestamp)) {
        displayProfileCard(cachedData.data);
    } else {
        $('#loader').show();

        $.get(userUrl, function (userData, status) {
            $('#loader').hide();

            if (status === 'success') {
                saveToCache(cacheKey, userData);
                displayProfileCard(userData);
            } else {
                $('#profileCard').html('<p>Error fetching user data.</p>');
            }
        }).fail(function () {
            $('#profileCard').html('<p>Error fetching user data.</p>');
        });
    }
}

function getCachedData(key) {
    const cachedData = localStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
}

function isCacheExpired(timestamp) {
    const expirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
    return Date.now() - timestamp > expirationTime;
}

function saveToCache(key, data) {
    const cacheData = {
        data: data,
        timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
}

function displayProfileCard(user) {
    const profileCard = $('#profileCard');
    profileCard.html(`
        <div class="card">
            <img src="${user.avatar_url}" alt="${user.login}" class="avatar">
            <div class="info">
                <p><strong>${user.login}</strong></p>
                <p><strong>${user.bio}</strong></p>
                <p><strong>${user.location}</strong></p>
                <p><a href="${user.html_url}" target="_blank">GitHub Profile</a></p>            
            </div>
        </div>
    `);
}

function fetchRepositories() {
    const username = $('#username').val();
    const perPage = $('#perPage').val();
    const repoUrl = `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${currentPage}`;

    $('#loader').show();
    $('#repositoriesContainer').empty();
    $('#pagination').empty();

    $.get(repoUrl, function (repoData, status, xhr) {
        $('#loader').hide();

        if (status === 'success') {
            totalPages = parseInt(xhr.getResponseHeader('Link').match(/&page=(\d+)>; rel="last"/)[1]);
            displayRepositories(repoData);
            displayPagination();
        } else {
            $('#repositoriesContainer').html('<p>Error fetching repositories.</p>');
        }
    });
}

async function displayRepositories(repositories) {
    const repositoriesContainer = $('#repositoriesContainer');

    for (const repo of repositories) {
        const topicsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/topics`;

        try {
            const topicsResponse = await $.get(topicsUrl);
            const topicsList = topicsResponse.names;

            repositoriesContainer.append(`
                <div class="repo-card">
                    <h3>${repo.name}</h3>
                    <p>${repo.description || 'No description available'}</p>
                    <p><strong>Topics:</strong> ${displayTopics(topicsList)}</p>
                </div>
            `);
        } catch (error) {
            console.error(`Error fetching topics for ${repo.name}: ${error}`);
        }
    }
}

function displayTopics(topicsList) {
    return topicsList.length > 0 ? topicsList.join(', ') : 'No topics specified';
}

function displayPagination() {
    const pagination = $('#pagination');
    
    if (currentPage > 1) {
        pagination.append(`<span onclick="goToPage(${currentPage - 1})">Older</span>`);
    }

    for (let i = 1; i <= totalPages; i++) {
        pagination.append(`<span onclick="goToPage(${i})" ${currentPage === i ? 'class="active"' : ''}>${i}</span>`);
    }

    if (currentPage < totalPages) {
        pagination.append(`<span onclick="goToPage(${currentPage + 1})">Newer</span>`);
    }
}

function goToPage(page) {
    currentPage = page;
    fetchRepositories();
}
