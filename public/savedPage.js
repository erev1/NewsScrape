var tempId = undefined

$.getJSON("/articles/saved", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page

    $(".article-container").append(`<div class='panel panel-default'><div class='panel-heading'><h3>
    	<a href='${data[i].link}'> ${data[i].title} <br /></h3><a data-id='${data[i]._id}' class="btn btn-success unsave">Unsave Article</a>
    	<a data-id='${data[i]._id}' class="btn btn-success notes">Notes</a>

      </div><div class='panel-body'>${data[i].snippet}</div></div>
    	`);


  }
});

$(document).on("click", ".unsave", saveArticle)
$(document).on("click", ".notes", showNotes)
$(document).on("submit", "#create-note", saveNote)
$(document).on("click", ".note-delete", deleteNote)



function saveArticle() {
	var id = $(this).attr('data-id')
	var url = `/articles/save/false/${id}`

	$.post(url, function(article) {
		console.log(article)
	})
}


function showNotes() {
  tempId = $(this).attr('data-id')

  $("#notes-content").empty()

  $.getJSON(`/notes/${tempId}`, function(data) {

    console.log(data)
    for (var i=0; i<data[0].note.length; i++){
      $("#notes-content").append(`<div class="panel-body">${data[0].note[i].body}
        <button data-id=${data[0].note[i]._id} class="btn btn-danger note-delete" style="float: right">x</button></div>`)
    }

  });

  $('#notesModal').modal('toggle')
}


function saveNote() {

  $.ajax({
    method: "POST",
    url: "/notes/" + tempId,
    data: {
      // Value taken from note text input
      body: $("#noteText").val(),
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
    });
}

function deleteNote() {
  var id = $(this).attr('data-id')
  console.log(id)
  var url = `/notes/delete/${id}`

  $.post(url, function(note) {
    console.log(note)
  })

  $('#notesModal').modal('toggle')

}