class ContactListItem {
  constructor(contactObj) {
    this.listItem = document.createElement('li');
    this.listItem.classList.add(`contacts-list-item`);
    this.listItem.appendChild(this.#createH2Element(contactObj));
    this.listItem.appendChild(this.#createContactInfoDLElement(contactObj));
    this.listItem.appendChild(this.#createEditButton(contactObj))
    this.listItem.appendChild(this.#createDeleteButton(contactObj))

    return this.listItem
  }

  #createH2Element(contactObj) {
    let contactNameHeader = document.createElement('h2');
    contactNameHeader.textContent = contactObj.full_name;
    contactNameHeader.classList.add('contact_name')

    return contactNameHeader
  }

  #createContactInfoDLElement(contactObj) {
    let contactInfoDL = document.createElement('dl');

    contactInfoDL.appendChild(this.#createPhoneNumberDTElement());
    contactInfoDL.appendChild(this.#createPhoneNumberDDElement(contactObj));

    contactInfoDL.appendChild(this.#createEmailDTElement());
    contactInfoDL.appendChild(this.#createEmailDDElement(contactObj));

    contactInfoDL.appendChild(this.#createTagsDTElement());
    contactInfoDL.appendChild(this.#createTagsDDElement(contactObj));

    return contactInfoDL
  }

  #createPhoneNumberDTElement() {
    let phoneNumberDT = document.createElement('dt');
    phoneNumberDT.textContent = 'Phone Number:';

    return phoneNumberDT
  }

  #createPhoneNumberDDElement(contactObj) {
    let phoneNumberDD = document.createElement('dd');
    phoneNumberDD.textContent = contactObj.phone_number;
    phoneNumberDD.classList.add('contact_number')

    return phoneNumberDD
  }

  #createEmailDTElement() {
    let emailDT = document.createElement('dt');
    emailDT.textContent = 'Email:';

    return emailDT
  }

  #createEmailDDElement(contactObj) {
    let emailDD = document.createElement('dd');
    emailDD.textContent = contactObj.email;
    emailDD.classList.add('contact_email');

    return emailDD
  }

  #createTagsDTElement() {
    let tagsDT = document.createElement('dt');
    tagsDT.textContent = 'Tag(s):';
    return tagsDT
  }

  #createTagsDDElement(contactObj) {
    let tagsDD = document.createElement('dd');
    if (contactObj.tags === null) tagsDD.textContent = 'None'
    else tagsDD.textContent = contactObj.tags.split(',').join(', ')
    tagsDD.classList.add('contact_tags')

    return tagsDD
  }

  #createEditButton(contactObj) {
    let editButton = document.createElement('a');
    editButton.textContent = "Edit"
    editButton.classList.add('edit-btn');
    editButton.classList.add('btn')
    editButton.setAttribute('href', `api/contacts/${contactObj.id}`)
    editButton.setAttribute('data-id', contactObj.id)

    return editButton
  }

  #createDeleteButton(contactObj) {
    let deleteButton = document.createElement('a');
    deleteButton.textContent = 'Delete'
    deleteButton.classList.add('delete-btn');
    deleteButton.classList.add('btn');
    deleteButton.setAttribute('href', `api/contacts/${contactObj.id}`)
    deleteButton.setAttribute('data-id', contactObj.id)

    return deleteButton
  }

}


class ContactManager {
  constructor() {
    this.addContactButton = document.querySelector('#add-contact-button');
    this.createOrEditContactForm = document.querySelector('.styled-form');
    this.createContactCancelButton = document.querySelector('#cancel_button');
    this.createNewTagButton = document.querySelector('#create-tag-button');
    this.cancelCreateNewTagButton = document.querySelector('#cancel-create-tag-button');
    this.createNewTagForm = document.querySelector('#tag-form');
    this.contactsContainerUL = document.querySelector('.contacts-container');
    this.searchByNameInput = document.querySelector('#search_name');
    this.assignContactTagDropDownList = document.querySelector('#assign_contact_tag_select');
    this.searchByTagDropDownList = document.querySelector('#search_tag_select');
    this.clearTagSelectionButton = document.querySelector('#clear_tag_btn');
    this.ulContactsContainer = document.querySelector('.contacts-container');
    this.noMatchingContactsPlaceHolder = document.querySelector('#no-matching-contacts-placeholder')

    this.tags = ['Marketing', 'Sales', 'Engineering'];
    this.formAccessedByEditButton = null;
    this.contactListItemBeingEdited = null;

    this.populateTagDropDownList()
    this.populateContactsContainer();

    this.bind()
  }

  populateTagDropDownList() {
    this.tags.forEach((tagName) => {
      this.addTagToDropDownList(tagName, this.assignContactTagDropDownList)
      this.addTagToDropDownList(tagName, this.searchByTagDropDownList)
    })
  }

  addTagToDropDownList(tag, tagDropDownList) {
    let tagOption = document.createElement('option');
    tagOption.setAttribute('value', tag);
    tagOption.textContent = tag;
    tagDropDownList.insertAdjacentElement("beforeend", tagOption);
  }

  async populateContactsContainer() {
    try {
      let response = await fetch('http://localhost:3000/api/contacts');
      let arrayOfContactsObjects = await response.json();

      arrayOfContactsObjects.forEach( contactObj => {
        let listItem = new ContactListItem(contactObj);
        this.ulContactsContainer.appendChild(listItem)
      })
    } catch {
      alert('Could not load contacts. Please try again.')
    }
  }

  handleCreateNewTagClick() {
    this.createNewTagForm.classList.remove('hide-form');
  }

  handleCancelCreatingNewTagClick() {
    this.createNewTagForm.classList.add("hide-form")
  }

  handleCreateNewTagSubmit(event) {
    event.preventDefault()
    let newTag = document.getElementById('tag_name').value
    this.tags.push(newTag);
    this.createNewTagForm.classList.add('hide-form');

    this.addTagToDropDownList(newTag, this.assignContactTagDropDownList);
    this.addTagToDropDownList(newTag, this.searchByTagDropDownList);

    alert("New tag created!")
  }

  handleAddContactBtnClick() {
    this.createOrEditContactForm.classList.remove('hide-form');
    this.createOrEditContactForm.classList.add('show-form');
    this.contactsContainerUL.style.display = 'none';
    this.formAccessedByEditButton = false;

  }

  async handleCreateOrEditContactFormSubmit(event) {
    event.preventDefault();
    if (!this.createOrEditContactForm.checkValidity()) {
      this.displayFormValidationErrorMessages()
      return
    }

    let contactObj
    try {
      contactObj = await this.makeFetchRequestWithFormData()
    } catch {
      alert("The form submission was unsuccessful. Please try again.")
    }

    let contactListItem = new ContactListItem(contactObj)
    this.ulContactsContainer.appendChild(contactListItem);
    this.createOrEditContactForm.classList.remove('show-form');
    this.createOrEditContactForm.classList.add('hide-form');
    this.clearErrorMessages()
    this.createOrEditContactForm.reset()
    this.contactsContainerUL.style.display = 'block';
  }

  static formDataToJson(formData) {
    // formData.entries() creates an iterator of [key, value] pairs.
    // Object.fromEntries() converts that iterator into a plain object.
    return Object.fromEntries(formData.entries());
  }

  async makeFetchRequestWithFormData() {
    let formData = new FormData(this.createOrEditContactForm);
    let jsobject = ContactManager.formDataToJson(formData)
    jsobject['tags'] = formData.getAll('tags').join(',')
    let json = JSON.stringify(jsobject);

    let HTTPmethod;
    let URL;
    if (this.formAccessedByEditButton) {
      HTTPmethod = 'PUT'
      URL = `http://localhost:3000/${this.contactListItemBeingEdited.querySelector('.edit-btn').getAttribute('href')}`
    } else {
      HTTPmethod = 'POST'
      URL = `http://localhost:3000/api/contacts/`
    }

    let response = await fetch(URL, {
      method: HTTPmethod,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: json
    })

    return await response.json();
  }

  clearErrorMessages() {
    let errorMessageSpans = document.querySelectorAll('.error_message');
    for (let i = 0; i < errorMessageSpans.length; i += 1) {
      errorMessageSpans[i].textContent = ''
    }
  }

  displayFormValidationErrorMessages() {
    let nameInput = document.querySelector('#full_name');
    let emailInput = document.querySelector('#email');
    let phoneNumberInput = document.querySelector('#phone_number');
    let tagSelectControl = document.querySelector('#assign_contact_tag_select');

    if (!nameInput.validity.valid) { nameInput.previousElementSibling.textContent = 'Please enter a name that is no more than 50 characters, including spaces.' }
    if (!emailInput.validity.valid) { emailInput.previousElementSibling.textContent = 'Please enter a valid email address that includes "@".' }
    if (!phoneNumberInput.validity.valid) { phoneNumberInput.previousElementSibling.textContent = "Please enter a phone number that only consists of exactly 10 digits." }
    if (!tagSelectControl.validity.valid) { tagSelectControl.previousElementSibling.textContent = "Please select at least one tag." }
  }

  handleCreateContactCancelButtonClick() {
    this.createOrEditContactForm.classList.remove('show-form');
    this.createOrEditContactForm.classList.add('hide-form');
    this.createOrEditContactForm.reset();
    this.contactsContainerUL.style.display = 'block';

    let nameInput = this.createOrEditContactForm.querySelector('#full_name');
    nameInput.setAttribute('placeholder', '')

    let emailInput = this.createOrEditContactForm.querySelector('#email');
    emailInput.setAttribute('placeholder', 'someone@example.com')

    let phone_numberInput = this.createOrEditContactForm.querySelector('#phone_number')
    phone_numberInput.setAttribute('placeholder', '1112223333')

    this.clearErrorMessages()
  }

  async handleDeleteContactClick(event) {
    event.preventDefault();

    try {
      let deleteButton = event.target;
      let path = deleteButton.getAttribute('href');
      let contactId = deleteButton.dataset.id;
      let json = JSON.stringify({id: contactId});

      let response = await fetch(`http://localhost:3000/${path}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        body: json

      })

      if (response.ok) {
        deleteButton.closest('li').remove()
      } else {
        alert('The contact could not be deleted. Please try again.')
      }

    } catch {
      alert('The contact could not be deleted. Please try again.')
    }
  }

  handleEditContactClick(event) {
    event.preventDefault()
    this.formAccessedByEditButton = true;
    this.contactListItemBeingEdited = event.target.closest('li');
    let nameInput = this.createOrEditContactForm.querySelector('#full_name');
    nameInput.setAttribute('placeholder', this.contactListItemBeingEdited.querySelector('.contact_name').textContent )
    let emailInput = this.createOrEditContactForm.querySelector('#email');
    emailInput.setAttribute('placeholder', this.contactListItemBeingEdited.querySelector('.contact_email').textContent)
    let phone_numberInput = this.createOrEditContactForm.querySelector('#phone_number')
    phone_numberInput.setAttribute('placeholder', this.contactListItemBeingEdited.querySelector('.contact_number').textContent)


    this.createOrEditContactForm.classList.remove('hide-form');
    this.createOrEditContactForm.classList.add('show-form');
    this.contactsContainerUL.style.display = 'none';
  }

  handleTagFilterSelection() {
    let tag = this.searchByTagDropDownList.value
    let contactListItems = document.querySelectorAll('.contacts-list-item');
    for (let i = 0; i < contactListItems.length; i += 1) {
      let tagsForContact = contactListItems[i].querySelector('dl').lastElementChild.textContent.split(', ')
      if (!tagsForContact.includes(tag)) {
        contactListItems[i].classList.add('hide-contact-list-item')
      } else {
        contactListItems[i].classList.remove('hide-contact-list-item')
      }
    }
  }

  handleClearTagFilter() {
    let contactListItems = document.querySelectorAll('.contacts-list-item');

    for (let i = 0; i < contactListItems.length; i += 1) {
      contactListItems[i].classList.remove('hide-contact-list-item')
    }

    this.searchByTagDropDownList.value = '';
  }

  handleSearchByNameInput() {
    let searchText = this.searchByNameInput.value;
    let searchTextInUpperCase = searchText.toUpperCase();
    let contactListItems = document.querySelectorAll('.contacts-list-item');


    if (searchText.trim().length === 0) {
      for (let i = 0; i < contactListItems.length; i += 1) {
        contactListItems[i].classList.remove('hide-contact-list-item')
        this.noMatchingContactsPlaceHolder.classList.add('hide');
      }
    } else {
      for (let i = 0; i < contactListItems.length; i += 1) {
        let contactName = contactListItems[i].firstElementChild.textContent;
        let upperCaseContactName = contactName.toUpperCase()

        if (upperCaseContactName.startsWith(searchTextInUpperCase)) {
          contactListItems[i].classList.remove('hide-contact-list-item')
        } else {
          contactListItems[i].classList.add('hide-contact-list-item')
        }
      }
    }

    if ((this.contactsContainerUL.querySelectorAll('.hide-contact-list-item').length === contactListItems.length)) {
      this.noMatchingContactsPlaceHolder.classList.remove('hide')
      this.noMatchingContactsPlaceHolder.firstElementChild.textContent = `There are no contact names starting with "${searchText}."`;
    } else {
      this.noMatchingContactsPlaceHolder.classList.add('hide')
    }
  }

  bind() {
    this.createNewTagButton.addEventListener('click', this.handleCreateNewTagClick.bind(this))
    this.cancelCreateNewTagButton.addEventListener('click', this.handleCancelCreatingNewTagClick.bind(this))
    this.createNewTagForm.addEventListener('submit', this.handleCreateNewTagSubmit.bind(this))
    this.addContactButton.addEventListener('click', this.handleAddContactBtnClick.bind(this))
    this.createOrEditContactForm.addEventListener('submit', this.handleCreateOrEditContactFormSubmit.bind(this))
    this.createContactCancelButton.addEventListener('click', this.handleCreateContactCancelButtonClick.bind(this))

    this.contactsContainerUL.addEventListener('click', (event) => {
      let target = event.target;

      if (target.classList.contains('delete-btn')) {
        this.handleDeleteContactClick(event);
      } else if (target.classList.contains('edit-btn')) {
        this.handleEditContactClick(event);
      }
    });

    this.searchByTagDropDownList.addEventListener('change', this.handleTagFilterSelection.bind(this))
    this.clearTagSelectionButton.addEventListener('click', this.handleClearTagFilter.bind(this))
    this.searchByNameInput.addEventListener('input', this.handleSearchByNameInput.bind(this))
  }
}

document.addEventListener('DOMContentLoaded', () => { new ContactManager()})

