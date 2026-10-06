class Context {
  constructor(data = {}) {
    this.data = {
      agent: data.agent || null,
      user: data.user || null,
      negocio: data.negocio || null,
      session: data.session || null,
    };

    this.messages = [];
  }

  addMessage(role, content, extra = {}) {
    this.messages.push({
      role,
      content,
      ...extra,
    });
  }

  getMessages() {
    return [...this.messages];
  }

  setData(key, value) {
    this.data[key] = value;
  }

  getData(key) {
    if (key) {
      return this.data[key];
    }

    return {
      ...this.data,
    };
  }

  clear() {
    this.messages = [];

    this.data = {
      agent: null,
      user: null,
      negocio: null,
      session: null,
    };
  }
}

module.exports = Context;
