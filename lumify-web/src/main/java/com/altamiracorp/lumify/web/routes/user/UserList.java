package com.altamiracorp.lumify.web.routes.user;

import com.altamiracorp.lumify.core.config.Configuration;
import com.altamiracorp.lumify.core.model.user.UserRepository;
import com.altamiracorp.lumify.web.BaseRequestHandler;
import com.altamiracorp.miniweb.HandlerChain;
import com.altamiracorp.securegraph.Vertex;
import com.google.inject.Inject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class UserList extends BaseRequestHandler {
    @Inject
    public UserList(
            final UserRepository userRepository,
            final Configuration configuration) {
        super(userRepository, configuration);
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, HandlerChain chain) throws Exception {
        Iterable<Vertex> users = getUserRepository().findAll();

        JSONObject resultJson = new JSONObject();
        JSONArray usersJson = getJson(users);
        resultJson.put("users", usersJson);

        respondWithJson(response, resultJson);
    }

    private JSONArray getJson(Iterable<Vertex> users) throws JSONException {
        JSONArray usersJson = new JSONArray();
        for (Vertex user : users) {
            usersJson.put(UserRepository.toJson(user));
        }
        return usersJson;
    }
}
