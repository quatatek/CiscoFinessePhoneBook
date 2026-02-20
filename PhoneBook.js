/**
 * Quata TEK Phonebook Gadget for Cisco Finesse
 * Copyright (C) 2026
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
clientLogs = finesse.cslogger.ClientLogger || {}; 

finesse.modules = finesse.modules || {};
finesse.modules.PhoneBookGadget = (function ($) {
    "use strict";

    var user,
        clientLogsLocal,
        containerServices,
        currentPhoneBookId = null,
        eventsBound = false,
        phoneBooksData = [],
        editingContactUri = null,
        currentContacts = [], // Store current contacts for filtering
        currentSearchTerm = ""; // Store current search term

    // ADMIN CREDENTIALS
    var ADMIN_USERNAME = "ADMIN USER"; 
    var ADMIN_PASSWORD = "ADMIN USER PASSWORD";

    function log(msg) {
        if (window.console) window.console.log("PB_DEBUG: " + msg);
        if (clientLogsLocal && clientLogsLocal.log) clientLogsLocal.log("PhoneBookGadget: " + msg);
    }

    function setStatus(message) {
        $("#pb-status").text(message || "");
    }

    function setSearchStatus(message) {
        $("#pb-search-status").text(message || "");
    }

    function buildAjaxHeaders() {
        return { "Authorization": "Basic " + btoa(ADMIN_USERNAME + ":" + ADMIN_PASSWORD) };
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function highlightText(text, searchTerm) {
        if (!searchTerm) return escapeHtml(text);
        
        var escapedText = escapeHtml(text);
        var escapedSearchTerm = escapeHtml(searchTerm);
        
        // Create regex for case-insensitive search
        var regex = new RegExp('(' + escapedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        
        return escapedText.replace(regex, '<span class="pb-search-match">$1</span>');
    }

    function initializeLayout() {
        setTimeout(function() {
            try {
                var gadgetHeight = $(window).height();
                var toolbarHeight = $(".pb-toolbar").outerHeight(true) || 60;
                var searchHeight = $(".pb-search-container").outerHeight(true) || 30;
                var modalHeight = $("#pb-contact-modal:visible").outerHeight(true) || 0;
                var fieldsetPadding = 10;
                var legendHeight = 20;
                var margins = 20;
                
                var availableHeight = gadgetHeight - toolbarHeight - searchHeight - modalHeight - fieldsetPadding - legendHeight - margins;
                availableHeight = Math.max(availableHeight, 150);
                
                $(".pb-table-area").css("height", availableHeight + "px");
                
                if (window.gadgets && gadgets.window) {
                    setTimeout(function() {
                        gadgets.window.adjustHeight();
                    }, 100);
                }
                
                log("Layout initialized. Table height: " + availableHeight + "px");
            } catch (e) {
                log("Error in initializeLayout: " + e.message);
            }
        }, 300);
    }

    function updateLayoutForModal(isVisible) {
        setTimeout(function() {
            try {
                var gadgetHeight = $(window).height();
                var toolbarHeight = $(".pb-toolbar").outerHeight(true) || 60;
                var searchHeight = $(".pb-search-container").outerHeight(true) || 30;
                var modalHeight = $("#pb-contact-modal:visible").outerHeight(true) || 0;
                var fieldsetPadding = 10;
                var legendHeight = 20;
                var margins = 20;
                
                var availableHeight = gadgetHeight - toolbarHeight - searchHeight - modalHeight - fieldsetPadding - legendHeight - margins;
                availableHeight = Math.max(availableHeight, 150);
                
                $(".pb-table-area").css("height", availableHeight + "px");
                
                if (window.gadgets && gadgets.window) {
                    setTimeout(function() {
                        gadgets.window.adjustHeight();
                    }, 100);
                }
                
                log("Layout updated. Modal visible: " + isVisible + ", Table height: " + availableHeight + "px");
            } catch (e) {
                log("Error in updateLayoutForModal: " + e.message);
            }
        }, 200);
    }

    function refreshPhoneBooks(successMsg) {
        log("Refreshing PhoneBooks...");
        setStatus("Refreshing...");
        setSearchStatus("");

        $.ajax({
            url: "/finesse/api/User/" + user.getId() + "/PhoneBooks",
            type: "GET",
            headers: buildAjaxHeaders(),
            success: function (xml) {
                parsePhoneBooks(xml, successMsg);
            },
            error: function (xhr) {
                log("Error fetching PhoneBooks: " + xhr.status);
                setStatus("Error loading books");
            }
        });
    }

    function parsePhoneBooks(xml, successMsg) {
        phoneBooksData = [];
        var $xml = (typeof xml === 'string') ? $($.parseXML(xml)) : $(xml);
        
        $xml.find("PhoneBook").each(function () {
            var $pb = $(this);
            var id = $pb.children("id").text();
            var name = $pb.children("name").text();
            var uri = $pb.children("uri").text();

            if (!id && uri) id = uri.split('/').pop();

            var contacts = [];
            $pb.find("Contact").each(function () {
                var $c = $(this);
                contacts.push({
                    uri: $c.find("uri").text(),
                    firstName: $c.find("firstName").text(),
                    lastName: $c.find("lastName").text(),
                    phoneNumber: $c.find("phoneNumber").text(),
                    description: $c.find("description").text()
                });
            });

            if (id) phoneBooksData.push({ id: id, name: name, uri: uri, contacts: contacts });
        });

        renderPhoneBooksDropdown();
        
        if (phoneBooksData.length > 0) {
            if (!currentPhoneBookId || !phoneBooksData.some(b => b.id === currentPhoneBookId)) {
                currentPhoneBookId = phoneBooksData[0].id;
            }
            showContactsForSelected(successMsg);
        } else {
            setStatus("No Books Found");
            renderContacts([]); 
        }
    }

    function showContactsForSelected(msg) {
        var selectedBook = phoneBooksData.find(b => b.id === currentPhoneBookId);
        if (selectedBook) {
            currentContacts = selectedBook.contacts; // Store contacts for filtering
            filterContacts(currentSearchTerm); // Apply any existing search filter
            setStatus(msg || "");
        }
    }

    function renderPhoneBooksDropdown() {
        var $select = $("#pb-select").empty();
        $.each(phoneBooksData, function (i, pb) {
            $("<option/>").val(pb.id).text(pb.name).appendTo($select);
        });
        if (currentPhoneBookId) $select.val(currentPhoneBookId);
    }

    function filterContacts(searchTerm) {
        currentSearchTerm = searchTerm || "";
        var searchTermLower = currentSearchTerm.toLowerCase().trim();
        
        // Clear search input
        $("#pb-search-input").val(currentSearchTerm);
        
        if (!searchTermLower) {
            // No search term, show all contacts
            renderContacts(currentContacts);
            setSearchStatus("");
            $("#pb-no-results").hide();
            return;
        }
        
        // Filter contacts
        var filteredContacts = currentContacts.filter(function(contact) {
            // Search in firstName, lastName, phoneNumber, and description
            var searchableText = (
                (contact.firstName || '') + ' ' +
                (contact.lastName || '') + ' ' +
                (contact.phoneNumber || '') + ' ' +
                (contact.description || '')
            ).toLowerCase();
            
            return searchableText.includes(searchTermLower);
        });
        
        // Update search status
        if (filteredContacts.length === 0) {
            setSearchStatus("No matches found");
            $("#pb-no-results").show();
            $("#pb-empty").hide();
            $("#pb-tbody").empty();
        } else {
            setSearchStatus("Found " + filteredContacts.length + " contact(s)");
            $("#pb-no-results").hide();
            renderFilteredContacts(filteredContacts, searchTermLower);
        }
    }

    function renderFilteredContacts(contacts, searchTerm) {
        var rowsHtml = "";
        $("#pb-tbody").empty();
        $("#pb-empty").hide();
        $("#pb-no-results").hide();

        $.each(contacts, function (i, c) {
            rowsHtml += '<tr data-contact-uri="' + escapeHtml(c.uri) + '">';
            rowsHtml += '<td><input type="checkbox" class="pb-row-select" /></td>';
            
            // Highlight matches in name
            var fullName = (c.firstName + " " + c.lastName).replace(/^,\s*/, "");
            rowsHtml += '<td>' + highlightText(fullName, searchTerm) + '</td>';
            
            // Highlight matches in phone number
            rowsHtml += '<td>' + highlightText(c.phoneNumber, searchTerm) + '</td>';
            
            // Highlight matches in description
            rowsHtml += '<td>' + highlightText(c.description, searchTerm) + '</td>';
            
            rowsHtml += '<td><button type="button" class="pb-action-btn pb-edit-btn">Edit</button></td>';
            rowsHtml += '</tr>';
        });
        
        $("#pb-tbody").html(rowsHtml);
        setTimeout(initializeLayout, 100);
    }

    function renderContacts(contacts) {
        var rowsHtml = "";
        $("#pb-tbody").empty();
        $("#pb-empty").hide();
        $("#pb-no-results").hide();

        if (!contacts || contacts.length === 0) {
            $("#pb-empty").show();
        } else {
            $.each(contacts, function (i, c) {
                rowsHtml += '<tr data-contact-uri="' + escapeHtml(c.uri) + '">';
                rowsHtml += '<td><input type="checkbox" class="pb-row-select" /></td>';
                var name = (c.firstName + " " + c.lastName).replace(/^,\s*/, "");
                rowsHtml += '<td>' + escapeHtml(name) + '</td>';
                rowsHtml += '<td>' + escapeHtml(c.phoneNumber) + '</td>';
                rowsHtml += '<td>' + escapeHtml(c.description) + '</td>';
                rowsHtml += '<td><button type="button" class="pb-action-btn pb-edit-btn">Edit</button></td>';
                rowsHtml += '</tr>';
            });
            $("#pb-tbody").html(rowsHtml);
        }
        
        setTimeout(initializeLayout, 100);
    }

    /* ---------- CRUD Actions ---------- */

    function createContact(pbId, contact) {
        var url = "/finesse/api/PhoneBook/" + pbId + "/Contact/";
        var xml = "<Contact><firstName>" + escapeHtml(contact.firstName) + "</firstName>" +
                  "<lastName>" + escapeHtml(contact.lastName) + "</lastName>" +
                  "<phoneNumber>" + escapeHtml(contact.phoneNumber) + "</phoneNumber>" +
                  "<description>" + escapeHtml(contact.description) + "</description></Contact>";

        $.ajax({
            url: url, type: "POST", contentType: "application/xml", data: xml, headers: buildAjaxHeaders(),
            success: function () { 
                $("#pb-contact-modal").hide(); 
                refreshPhoneBooks("Contact added");
                // Clear search when adding new contact
                $("#pb-search-input").val("");
                currentSearchTerm = "";
            },
            error: function (xhr) { alert("Add failed. Status: " + xhr.status); }
        });
    }

    function updateContact(uri, contact) {
        var xml = "<Contact><firstName>" + escapeHtml(contact.firstName) + "</firstName>" +
                  "<lastName>" + escapeHtml(contact.lastName) + "</lastName>" +
                  "<phoneNumber>" + escapeHtml(contact.phoneNumber) + "</phoneNumber>" +
                  "<description>" + escapeHtml(contact.description) + "</description></Contact>";

        $.ajax({
            url: uri, type: "PUT", contentType: "application/xml", data: xml, headers: buildAjaxHeaders(),
            success: function () { 
                $("#pb-contact-modal").hide(); 
                refreshPhoneBooks("Contact updated");
                // Re-apply search filter if active
                if (currentSearchTerm) {
                    filterContacts(currentSearchTerm);
                }
            },
            error: function (xhr) { alert("Update failed. Status: " + xhr.status); }
        });
    }

    function deleteContacts(uris) {
        var count = uris.length;
        if (!confirm("Delete " + count + " contact(s)?")) return;
        setStatus("Deleting...");
        $.each(uris, function (i, uri) {
            $.ajax({
                url: uri, type: "DELETE", headers: buildAjaxHeaders(),
                complete: function () {
                    count--;
                    if (count === 0) {
                        refreshPhoneBooks("Contact(s) deleted");
                        // Clear search after delete
                        $("#pb-search-input").val("");
                        currentSearchTerm = "";
                    }
                }
            });
        });
    }

    /* ---------- Event Listeners ---------- */

    function bindEvents() {
        if (eventsBound) return;
        eventsBound = true;

        $(document).on("click", "#pb-refresh-btn", function () { 
            refreshPhoneBooks("Refreshed"); 
        });

        $(document).on("change", "#pb-select", function () {
            currentPhoneBookId = $(this).val();
            // Clear search when switching phone books
            $("#pb-search-input").val("");
            currentSearchTerm = "";
            showContactsForSelected();
        });

        $(document).on("click", "#pb-add-btn", function () {
            if (!currentPhoneBookId) return alert("Select a phone book first.");
            $("#pb-modal-title").text("Add Contact");
            $("#pb-contact-modal input").val("");
            $("#pb-contact-modal").show();
            updateLayoutForModal(true);
        });

        $(document).on("click", "#pb-save-btn", function () {
            var contact = {
                firstName: $("#pb-modal-firstName").val(),
                lastName: $("#pb-modal-lastName").val(),
                phoneNumber: $("#pb-modal-phoneNumber").val(),
                description: $("#pb-modal-description").val()
            };
            if (!contact.phoneNumber) return alert("Phone number is required.");
            
            var isAdd = ($("#pb-modal-title").text() === "Add Contact");
            if (isAdd) createContact(currentPhoneBookId, contact);
            else updateContact(editingContactUri, contact);
        });

        $(document).on("click", "#pb-cancel-btn", function () { 
            $("#pb-contact-modal").hide(); 
            updateLayoutForModal(false);
        });

        $(document).on("click", ".pb-edit-btn", function () {
            var uri = $(this).closest("tr").data("contact-uri");
            editingContactUri = uri;
            var pb = phoneBooksData.find(b => b.id === currentPhoneBookId);
            var contact = pb.contacts.find(c => c.uri === uri);
            if (contact) {
                $("#pb-modal-title").text("Edit Contact");
                $("#pb-modal-firstName").val(contact.firstName);
                $("#pb-modal-lastName").val(contact.lastName);
                $("#pb-modal-phoneNumber").val(contact.phoneNumber);
                $("#pb-modal-description").val(contact.description);
                $("#pb-contact-modal").show();
                updateLayoutForModal(true);
            }
        });

        $(document).on("change", ".pb-row-select, #pb-select-all", function () {
            if ($(this).attr("id") === "pb-select-all") $(".pb-row-select").prop("checked", $(this).is(":checked"));
            $("#pb-delete-selected-btn").prop("disabled", $(".pb-row-select:checked").length === 0);
        });

        $(document).on("click", "#pb-delete-selected-btn", function () {
            var uris = [];
            $(".pb-row-select:checked").each(function () { uris.push($(this).closest("tr").data("contact-uri")); });
            deleteContacts(uris);
        });

        // Search functionality
        $(document).on("input", "#pb-search-input", function() {
            var searchTerm = $(this).val();
            filterContacts(searchTerm);
        });

        $(document).on("keydown", "#pb-search-input", function(e) {
            // Clear search on Escape key
            if (e.key === 'Escape') {
                $(this).val('');
                filterContacts('');
            }
        });

        $(document).on("click", "#pb-search-clear", function() {
            $("#pb-search-input").val('');
            filterContacts('');
        });

        $(window).on("resize", function() {
            initializeLayout();
        });
    }

    return {
        init: function () {
            var cfg = finesse.gadget.Config;
            clientLogsLocal = finesse.cslogger.ClientLogger;
            finesse.clientservices.ClientServices.init(cfg, false);
            clientLogsLocal.init(gadgets.Hub, "PhoneBookGadget", cfg);

            user = new finesse.restservices.User({
                id: cfg.id, 
                onLoad: function() { 
                    bindEvents();
                    refreshPhoneBooks();
                    setTimeout(initializeLayout, 500);
                }
            });

            containerServices = finesse.containerservices.ContainerServices.init();
            containerServices.addHandler(finesse.containerservices.ContainerServices.Topics.ACTIVE_TAB, function() {
                setTimeout(initializeLayout, 300);
            });
            containerServices.makeActiveTabReq();
        }
    };
}(jQuery));