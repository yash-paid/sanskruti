function likeComment(elem) {
  const countSpan = elem.querySelector('.like-count');
  let count = parseInt(countSpan.textContent);
  if (elem.classList.contains('liked')) {
    count--;
    elem.classList.remove('liked');
    elem.style.color = '';
  } else {
    count++;
    elem.classList.add('liked');
    elem.style.color = 'var(--accent-gold)';
  }
  countSpan.textContent = count;
}

function toggleReplyBox(elem) {
  const commentContent = elem.closest('.comment-content');
  const replyBox = commentContent.querySelector('.reply-box');
  if (replyBox.style.display === 'none' || replyBox.style.display === '') {
    replyBox.style.display = 'flex';
  } else {
    replyBox.style.display = 'none';
  }
}

function postReply(button) {
  const replyBox = button.parentElement;
  const input = replyBox.querySelector('.reply-input');
  const replyText = input.value.trim();
  if (!replyText) return alert('Reply cannot be empty');

  const replyDiv = document.createElement('div');
  replyDiv.classList.add('comment');
  replyDiv.style.marginTop = '1rem';
  replyDiv.style.paddingLeft = '1rem';
  replyDiv.style.borderLeft = '2px solid var(--accent-pink)';
  replyDiv.style.background = 'rgba(255, 255, 255, 0.01)';

  replyDiv.innerHTML = `
    <img src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=100" alt="you" />
    <div class="comment-content">
      <div class="comment-header">
        You <span class="comment-time">• just now</span>
      </div>
      <p class="comment-text">${replyText}</p>
      <div class="comment-actions">
        <span class="like-btn" onclick="likeComment(this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          <span class="like-count">0</span>
        </span>
      </div>
    </div>
  `;

  const commentContent = button.closest('.comment-content');
  const repliesContainer = commentContent.querySelector('.replies');
  repliesContainer.appendChild(replyDiv);

  input.value = '';
  replyBox.style.display = 'none';
}

function postComment() {
  const commentBox = document.getElementById("userComment");
  const commentText = commentBox.value.trim();

  if (!commentText) return;

  const newComment = document.createElement("div");
  newComment.classList.add("comment");

  newComment.innerHTML = `
    <img src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=100" alt="you" />
    <div class="comment-content">
      <div class="comment-header">
        You <span class="comment-time">• just now</span>
      </div>
      <p class="comment-text">${commentText}</p>
      <div class="comment-actions">
        <span class="like-btn" onclick="likeComment(this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          <span class="like-count">0</span>
        </span> •
        <span class="reply-btn" onclick="toggleReplyBox(this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          Reply
        </span>
      </div>

      <div class="reply-box" style="display:none; margin-top: 1rem; gap: 0.8rem;">
        <input type="text" placeholder="Write a reply..." class="reply-input" />
        <button onclick="postReply(this)">Reply</button>
      </div>

      <div class="replies" style="margin-left: 2rem;"></div>
    </div>
  `;

  const commentList = document.getElementById("commentList");
  commentList.insertBefore(newComment, commentList.firstChild);

  commentBox.value = "";
}

function fakeLoadMore() {
  alert("Unable to load more reviews now. Server is currently experiencing high latency.");
}

function toggleDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('dropdownMenu');
  menu.classList.toggle('active');
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('dropdownMenu');
  const toggle = document.getElementById('menuToggle');
  if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
    menu.classList.remove('active');
  }
});