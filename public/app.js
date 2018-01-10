$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    // since you're using a template string, you might want to take advantage of its
    // ability to be split up over multiple lines.
    $(".article-container").append(`
      <div class='panel panel-default'>
        <div class='panel-heading'>
          <h3>
          	<a href='${data[i].link}'> ${data[i].title}<br />
          </h3>
          <a data-id='${data[i]._id}' class="btn btn-success save">Save Article</a>
      	</div>
        <div class='panel-body'>${data[i].snippet}</div>
      </div>
    	`);


  }
});

$(document).on("click", ".save", saveArticle)

function saveArticle() {
	console.log("this was clicked")
	var id = $(this).attr('data-id')
	var url = `/articles/save/true/${id}`

	$.post(url, function(article) {
		console.log(article)
	})
}


