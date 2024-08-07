const Event = require('../models/event');
const User = require('../models/user');
const { validateEventType, validateAmountInvited } = require('./validationController.js');

const getUserName = async (req, res, next) => {
    try {
        const userData = req.user;
        res.json({ username: userData.username });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to get user data' });
    }
};

const newEvent = async (req, res, next) => {
    try {
        const { eventType, groomName, brideName, name, amountInvited, selectedDate, selectedRegions, costs, checkLists } = req.body;

        validateEventType(eventType);
        validateAmountInvited(amountInvited);

        if (selectedDate && new Date(selectedDate) < new Date()) {
            return res.status(400).json({ message: "The event date cannot be in the past." });
        }

        const eventData = {
            eventType,
            amountInvited,
            selectedRegions,
            userId: req.user.userId,
            costs,
            checkLists
        };

        if (eventType === "חתונה" || eventType === "חינה") {
            eventData.groomName = groomName;
            eventData.brideName = brideName;
        } else {
            eventData.name = name;
        }
        
        if (selectedDate) {
            eventData.eventDate = selectedDate;
        }

        const createdEvent = new Event(eventData);
        await createdEvent.save();

        const user = await User.findById(req.user.userId);
        user.events.push(createdEvent);
        await user.save();

        res.status(201).json({ message: "Event created successfully", event: createdEvent });
    } catch (error) {
        res.status(500).json({ message: "Failed to create event", error: error.message });
    }
};

const getEvent = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userExists = await User.findById(userId);

        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

        const events = await Event.find({ userId: userId });

        res.json({ events: events });
    } catch (err) {
        res.status(500).json({ message: err.message || "An error occurred while retrieving the events." });
    }
};

const deleteEvent = async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!req.user || !req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!event.userId) {
            return res.status(500).json({ message: 'Event integrity error' });
        }

        if (event.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await Event.findByIdAndDelete(eventId); 
        await User.updateOne({ _id: event.userId }, { $pull: { events: eventId } });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete event with ID: ${eventId}, Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to delete event' });
    }
};

const getSpecificEvent = async (req, res, next) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this event' });
        }

        res.json({ event });
    } catch (err) {
        res.status(500).json({ message: err.message || "An error occurred while retrieving the event." });
    }
};

const addPhoto = async (req, res) => {
    const eventId = req.params.eventId;
    const { photoUri } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found." });
        }
    
        event.photo = photoUri; 
        await event.save();
        res.status(200).json({ message: "Photo URI added successfully", event });
      } catch (error) {
        console.error('Error adding photo URI:', error);
        res.status(500).json({ message: "Failed to add photo URI", error: error.message });
      }
};

const updateEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { groomName, brideName, name, amountInvited, selectedDate, selectedRegions } = req.body;

    try {
        if (selectedDate && new Date(selectedDate) < new Date()) {
            return res.status(400).json({ message: "The event date cannot be in the past." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.eventType === "חתונה" || event.eventType === "חינה") {
            event.groomName = groomName;
            event.brideName = brideName;
        } else {
            event.name = name;
        }

        event.amountInvited = amountInvited;
        event.eventDate = selectedDate;
        event.selectedRegions = selectedRegions;

        await event.save();
        res.status(200).json({ message: "Event updated successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update event" });
    }
};

const addCostsToEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { costs } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        for (const newCost of costs) {
            const existingCost = event.costs.find(cost => cost.label === newCost.label);
            if (existingCost) {
                return res.status(400).json({ message:`Cost with label '${newCost.label}' already exists.`});
            }
            event.costs.push(newCost);
        }

        await event.save();
        res.status(200).json({ message: "All new costs added successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update costs" });
    }
};

const updateCostsInEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { index, newCostData } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (index < 0 || index >= event.costs.length) { 
            return res.status(404).json({ message: "Cost index out of bounds" });
        }              

        event.costs[index] = { ...event.costs[index], ...newCostData };
        await event.save();
        res.status(200).json({ message: "Cost updated successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update cost" });
    }
};

const deleteCostInEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { index } = req.body; 

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (index < 0 || index >= event.costs.length) {
            return res.status(404).json({ message: "Cost index out of bounds" });
        }

        event.costs.splice(index, 1);
        await event.save();
        res.status(200).json({ message: "Cost deleted successfully", event });
    } catch (error) {
        console.error(`Failed to delete cost with ID: ${eventId}, Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to delete cost' });
    }
};

const addTasksToEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { checkLists } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        for (const newTask of checkLists) {
            const existingCheckList = event.checkLists.find(
                checkList => checkList.timeframe === newTask.timeframe
            );

            if (!newTask.timeframe || newTask.tasks.some(task => !task.label)) {
                return res.status(400).json({ message: "Timeframe and task labels must not be empty." });
            }

            if (existingCheckList) {
                for (const task of newTask.tasks) {
                    const existingTask = existingCheckList.tasks.find(t => t.label === task.label);
                    if (existingTask) {
                        return res.status(400).json({
                            message: `Task "${task.label}" already exists in the timeframe "${newTask.timeframe}".`
                        });
                    }
                }

                existingCheckList.tasks.push(...newTask.tasks);
            } else {
                event.checkLists.push(newTask);
            }
        }

        await event.save();
        res.status(200).json({ message: "All new Tasks added successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update check List" });
    }
};

const updateTaskCompletion = async (req, res) => {
    const eventId = req.params.eventId;
    const { timeframe, label, completed } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        const checkList = event.checkLists.find(
            checkList => checkList.timeframe === timeframe
        );

        if (!checkList) {
            return res.status(404).json({ message: "Timeframe not found" });
        }

        const task = checkList.tasks.find(t => t.label === label);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        task.completed = completed;

        await event.save();
        res.status(200).json({ message: "Task updated successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update task completion status" });
    }
};

const addGuestToEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { name, phone } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if the phone number already exists in the guest list
        const guestExists = event.guests.some(guest => guest.phone === phone);
        if (guestExists) {
            return res.status(400).json({ message: "Phone number already exists in the guest list" });
        }

        // Add the new guest with invited set to true
        event.guests.push({ name, phone, invited: true });
        await event.save();

        res.status(200).json({ message: "Guest added successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to add guest" });
    }
};


const getEventGuests = async (req, res) => {
    const eventId = req.params.eventId;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({ guests: event.guests });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to retrieve guests" });
    }
};

const removeGuestFromEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
       
        const guestIndex = event.guests.findIndex(guest => guest.phone === phone);
        if (guestIndex === -1) {
            return res.status(404).json({ message: "Guest not found in the list" });
        }

        if (guestIndex < 0 || guestIndex >= event.guests.length) {
            return res.status(404).json({ message: "Guest not found in the list" });
        }
        
        event.guests.splice(guestIndex, 1);
        await event.save();

        res.status(200).json({ message: "Guest removed successfully", event });
    } catch (error) {
        console.error(`Failed to remove guest with phone: ${phone}, Error: ${error.message}`);
        res.status(500).json({ message: error.message || "Failed to remove guest" });
    }
};


const addPaymentDeadlinesToEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const { paymentDeadlines } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "האירוע לא נמצא" });
        }

        for (const newDeadline of paymentDeadlines) {
            if (!newDeadline.supplierName || !newDeadline.date) {
                return res.status(400).json({ message: "שם הספק ותאריך לא יכולים להיות ריקים" });
            }

            const existingDeadline = event.paymentDeadlines.find(
                deadline => deadline.supplierName === newDeadline.supplierName && new Date(deadline.date).getTime() === new Date(newDeadline.date).getTime()
            );

            if (existingDeadline) {
                return res.status(400).json({
                    message: `מועד התשלום לספק "${newDeadline.supplierName}" בתאריך "${newDeadline.date}" כבר קיים`
                });
            }

            event.paymentDeadlines.push(newDeadline);
        }

        await event.save();
        res.status(200).json({ message: "כל מועדי התשלום החדשים נוספו בהצלחה", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "הוספת מועדי התשלום נכשלה" });
    }
};

const updatePaymentDeadlineCompletion = async (req, res) => {
    const eventId = req.params.eventId;
    const { supplierName, date, completed } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "האירוע לא נמצא" });
        }

        const deadline = event.paymentDeadlines.find(
            deadline => deadline.supplierName === supplierName && new Date(deadline.date).getTime() === new Date(date).getTime()
        );

        if (!deadline) {
            return res.status(404).json({ message: "מועד התשלום לא נמצא" });
        }

        deadline.completed = completed;

        await event.save();
        res.status(200).json({ message: "מועד התשלום עודכן בהצלחה", event });
    } catch (error) {
        res.status(500).json({ message: error.message || "עדכון סטטוס מועד התשלום נכשל" });
    }
};

exports.addPaymentDeadlinesToEvent=addPaymentDeadlinesToEvent;
exports.updatePaymentDeadlineCompletion=updatePaymentDeadlineCompletion;
exports.removeGuestFromEvent = removeGuestFromEvent;
exports.addGuestToEvent = addGuestToEvent;
exports.getEventGuests = getEventGuests;

exports.addPhoto = addPhoto;
exports.addTasksToEvent = addTasksToEvent;
exports.updateTaskCompletion = updateTaskCompletion;
exports.addCostsToEvent = addCostsToEvent;
exports.updateCostsInEvent = updateCostsInEvent;
exports.deleteCostInEvent = deleteCostInEvent;
exports.getSpecificEvent = getSpecificEvent;
exports.deleteEvent = deleteEvent;
exports.getEvent = getEvent;
exports.getUserName = getUserName;
exports.newEvent = newEvent;
exports.updateEvent = updateEvent;
