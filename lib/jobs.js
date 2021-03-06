/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var assert = require('assert-plus');



///--- API

// Given a "raw" job record from marlin, generate a user-acceptable
// form of the job (this whitelists out internal details).  `summary`
// simply indicates whether or not to tack on all the phase details
// Returns an object
function translateJob(job, summary) {
    assert.object(job, 'job');
    assert.optionalBool(summary, 'summary');

    var obj = {
        id: job.jobId,
        name: job.name,
        state: job.state,
        cancelled: job.timeCancelled ? true : false,
        inputDone: job.timeInputDone ? true : false,
        transient: job.transient || false,
        stats: {},
        timeCreated: job.timeCreated,
        timeDone: job.timeDone
    };

    if (job.timeArchiveStarted)
        obj.timeArchiveStarted = job.timeArchiveStarted;
    if (job.timeArchiveDone)
        obj.timeArchiveDone = job.timeArchiveDone;

    if (obj.cancelled)
        obj.inputDone = true;

    if (job.stats) {
        var js = job.stats;
        obj.stats.errors = js.nErrors || 0;
        obj.stats.outputs = js.nJobOutputs || 0;
        obj.stats.retries = js.nRetries || 0;
        obj.stats.tasks = js.nTasksDispatched || 0;
        obj.stats.tasksDone =
            (js.nTasksCommittedOk || 0) +
            (js.nTasksCommittedFail || 0);
    }

    if (!summary) {
        /*
         * Translate "storage-map" to "map" for external consumption.
         * Marlin stopped using "storage-map" after MANTA-1315, but this
         * allows it to work compatibly.
         */
        obj.phases = job.phases.map(function (p) {
            var o = {};
            for (var k in p)
                o[k] = p[k];
            if (p['type'] == 'storage-map')
                o['type'] = 'map';
            return (o);
        });
    }

    if (job.options)
        obj.options = job.options;

    return (obj);
}



///--- Exports

module.exports = {
    translateJob: translateJob
};
