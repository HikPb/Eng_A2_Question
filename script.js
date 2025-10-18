// Khai báo biến toàn cục để lưu trữ dữ liệu
let partsData = [];

// Lấy các phần tử DOM
const searchBox = document.getElementById('search-box');
const searchResults = document.getElementById('search-results');
const rightPanel = document.getElementById('right-panel');

// Hàm 1: Tải dữ liệu từ tệp JSON
async function loadData() {
    try {
        // Lưu ý: Cần chạy qua Local Server để tránh lỗi CORS khi fetch tệp JSON
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`Lỗi tải dữ liệu: ${response.statusText}`);
        }
        partsData = await response.json();
        // Sau khi tải xong, hiển thị toàn bộ nội dung ban đầu
        displayAllContent();
    } catch (error) {
        console.error("Không thể tải dữ liệu:", error);
        rightPanel.innerHTML = '<h2>Lỗi tải dữ liệu</h2><p>Không thể tải tệp data.json. Hãy đảm bảo bạn đang chạy trang web bằng Local Server.</p>';
    }
}

// Hàm mới: Xử lý ẩn/hiện nội dung dịch
function toggleTranslation(event) {
    const button = event.target;
    // Tìm phần tử cha gần nhất để đảm bảo chỉ tìm nội dung dịch trong phạm vi đó
    const container = button.closest('.qa-item') || button.closest('#right-panel'); 
    
    // Tìm phần tử chứa nội dung dịch bên trong container này
    const translateDiv = container.querySelector('.translate-content');
    
    if (translateDiv) {
        // Toggle (chuyển đổi) thuộc tính display
        if (translateDiv.style.display === 'block') {
            translateDiv.style.display = 'none';
            button.textContent = 'Thêm';
        } else {
            translateDiv.style.display = 'block';
            button.textContent = 'Ẩn';
        }
    }
}

function formatTextForHtml(text) {
    // Thay thế tất cả các ký tự xuống dòng (gồm cả \r\n và \n) bằng thẻ <br>
    return text.replace(/(\r\n|\n|\r)/gm, '<br>');
}

// Hàm 2: Hiển thị TOÀN BỘ nội dung ban đầu (Đã cập nhật)
function displayAllContent() {
    rightPanel.innerHTML = ''; // Xóa nội dung cũ
    partsData.forEach(part => {
        const partDiv = document.createElement('div');
        partDiv.className = 'qa-part';
        partDiv.innerHTML = `<h2>${part.title}</h2>`;

        part.qas.forEach(qa => {
            const qaDiv = document.createElement('div');
            qaDiv.className = 'qa-item';
            
            const formattedAnswer = formatTextForHtml(qa.answer);
            const formattedTranslate = formatTextForHtml(qa.translate);
            // Xây dựng HTML cho câu hỏi, trả lời, nút và phần dịch
            qaDiv.innerHTML = `
                <h3>${qa.question}</h3>
                <p>${formattedAnswer}</p>
                <button class="toggle-button">Thêm</button>
                <div class="translate-content">
                    <h4>Nội dung tiếng Anh:</h4>
                    <p>${formattedTranslate}</p>
                </div>
            `;
            partDiv.appendChild(qaDiv);
            
            // Gắn sự kiện cho nút ngay sau khi tạo
            const button = qaDiv.querySelector('.toggle-button');
            button.addEventListener('click', toggleTranslation);
        });

        rightPanel.appendChild(partDiv);
    });
}

// Hàm 3: Hiển thị câu trả lời cho một câu hỏi cụ thể (theo ID) (Đã cập nhật)
function displayAnswer(qaId) {
    let foundQa = null;
    for (const part of partsData) {
        foundQa = part.qas.find(qa => qa.id === qaId);
        if (foundQa) break;
    }

    if (foundQa) {
        const formattedAnswer = formatTextForHtml(foundQa.answer);
        const formattedTranslate = formatTextForHtml(foundQa.translate);
        // Tạo nội dung chi tiết
        const contentHtml = `
            <div class="qa-item">
                <h2>${foundQa.question}</h2>
                <p>${formattedAnswer}</p>
                <button id="detail-toggle-button" class="toggle-button">Ẩn</button>
                <div id="detail-translate-content" class="translate-content" style="display:block;">
                    <h4>Nội dung tiếng Anh:</h4>
                    <p>${formattedTranslate}</p>
                </div>
            </div>
            <hr>
            <p style="font-style: italic;">(Đây là kết quả tìm kiếm chi tiết.)</p>
        `;
        rightPanel.innerHTML = contentHtml;
        
        // Gắn sự kiện cho nút trong nội dung chi tiết
        const button = document.getElementById('detail-toggle-button');
        if (button) {
            button.addEventListener('click', toggleTranslation);
        }
    }
}


// Hàm 4: Hiển thị kết quả tìm kiếm đã được nhóm theo Phần (Không thay đổi)
function renderGroupedResults(groupedResults) {
    searchResults.innerHTML = ''; 

    if (Object.keys(groupedResults).length === 0) {
        searchResults.innerHTML = '<li>Không tìm thấy kết quả phù hợp.</li>';
        rightPanel.innerHTML = '<h2>Không tìm thấy câu hỏi nào.</h2><p>Vui lòng thử tìm kiếm với từ khóa khác.</p>';
        return;
    }

    let firstQaId = null;

    for (const partTitle in groupedResults) {
        const partResults = groupedResults[partTitle];
        
        const partHeader = document.createElement('li');
        partHeader.textContent = partTitle;
        partHeader.className = 'part-header';
        searchResults.appendChild(partHeader);

        partResults.forEach(qa => {
            const li = document.createElement('li');
            li.textContent = qa.question;
            li.dataset.qaId = qa.id;

            if (firstQaId === null) {
                firstQaId = qa.id;
            }

            li.addEventListener('click', function() {
                document.querySelectorAll('#search-results li').forEach(item => {
                    item.classList.remove('selected-result');
                });
                this.classList.add('selected-result');
                displayAnswer(Number(this.dataset.qaId));
            });
            
            searchResults.appendChild(li);
        });
    }

    if (firstQaId !== null) {
        const firstLi = document.querySelector(`li[data-qa-id="${firstQaId}"]`);
        if (firstLi) {
            firstLi.click(); 
        }
    }
}


// Hàm 5: Xử lý tìm kiếm (Nhóm theo Phần) (Không thay đổi)
function handleSearch() {
    const query = searchBox.value.toLowerCase().trim();
    searchResults.innerHTML = ''; 

    if (query === '') {
        displayAllContent();
        return;
    }

    const groupedResults = {};

    partsData.forEach(part => {
        const filteredQas = part.qas.filter(qa => 
            qa.question.toLowerCase().includes(query)
        );

        if (filteredQas.length > 0) {
            groupedResults[part.title] = filteredQas; 
        }
    });

    renderGroupedResults(groupedResults);
}

// Gắn sự kiện lắng nghe cho ô tìm kiếm
searchBox.addEventListener('input', handleSearch);

// Khởi tạo: Tải dữ liệu khi trang tải xong
document.addEventListener('DOMContentLoaded', loadData);