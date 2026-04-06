const { nanoid } = require('nanoid');
const roomSessions = require('../roomSessions');
const Poll = require('../../models/Poll');

const handlePollCreate = async (ws, data, roomId, userId) => {
  const { question, options } = data;

  try {
    const pollId = nanoid();
    const formattedOptions = options.map(opt => ({
      id: nanoid(),
      text: opt,
      votes: 0
    }));

    const newPoll = await Poll.create({
      pollId,
      roomId,
      createdBy: userId,
      question,
      options: formattedOptions
    });

    // Broadcast
    const room = roomSessions.get(roomId);
    if (room) {
      const message = JSON.stringify({
        type: 'poll_created',
        data: { poll: newPoll }
      });
      for (const clientWs of room.clients.keys()) {
        if (clientWs.readyState === 1) clientWs.send(message);
      }
    }
  } catch (err) {
    console.error('Error creating poll:', err);
  }
};

const handlePollVote = async (ws, data, roomId, userId) => {
  const { pollId, optionId } = data;

  try {
    const poll = await Poll.findOne({ pollId, roomId });
    if (!poll) return;

    if (!poll.isActive) return;

    // Check if user already voted
    if (poll.voters.includes(userId)) {
      return; // prevent double vote
    }

    // Find the option and increment its vote
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) return;

    option.votes += 1;
    poll.voters.push(userId);
    await poll.save();

    // Broadcast updated poll
    const room = roomSessions.get(roomId);
    if (room) {
      const message = JSON.stringify({
        type: 'poll_updated',
        data: { poll }
      });
      for (const clientWs of room.clients.keys()) {
        if (clientWs.readyState === 1) clientWs.send(message);
      }
    }
  } catch (err) {
    console.error('Error voting on poll:', err);
  }
};

module.exports = { handlePollCreate, handlePollVote };
